 import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [registerNumber, setRegisterNumber] = useState('')
  const [totalClasses, setTotalClasses] = useState('')
  const [presentClasses, setPresentClasses] = useState('')

  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState(null)

  const [editId, setEditId] = useState(null)

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [searchText, setSearchText] = useState('')

  // GET STUDENTS
  const getStudents = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/students'
      )

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()

      setStudents(data)
    } catch (error) {
      console.log('Fetch error:', error)
    }
  }

  useEffect(() => {
    getStudents()
  }, [])

  // CLEAR FORM
  const clearForm = () => {
    setName('')
    setRegisterNumber('')
    setTotalClasses('')
    setPresentClasses('')
    setAttendance(null)
    setEditId(null)
  }

  // ADD / UPDATE STUDENT
  const saveStudent = async () => {
    if (
      name.trim() === '' ||
      registerNumber.trim() === '' ||
      totalClasses === '' ||
      presentClasses === ''
    ) {
      alert('Please enter all details')
      return
    }

    const total = Number(totalClasses)
    const present = Number(presentClasses)

    if (total <= 0) {
      alert('Total classes must be greater than 0')
      return
    }

    if (present < 0) {
      alert('Present classes cannot be negative')
      return
    }

    if (present > total) {
      alert(
        'Present classes cannot be greater than total classes'
      )
      return
    }

    const absent = total - present

    const studentData = {
      name: name.trim(),
      registerNumber: registerNumber.trim(),
      totalClasses: total,
      present: present,
      absent: absent
    }

    try {
      let response

      if (editId) {
        response = await fetch(
          `http://localhost:5000/students/${editId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
          }
        )
      } else {
        response = await fetch(
          'http://localhost:5000/students',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
          }
        )
      }

      if (!response.ok) {
        throw new Error('Server error')
      }

      const percentage = (present / total) * 100

      setAttendance(percentage.toFixed(2))

      if (editId) {
        alert('Student updated successfully!')
      } else {
        alert('Student added successfully!')
      }

      clearForm()

      getStudents()
    } catch (error) {
      console.log('Save error:', error)
      alert('Backend connection error')
    }
  }

  // EDIT
  const editStudent = (student) => {
    setEditId(student._id)

    setName(student.name)
    setRegisterNumber(student.registerNumber)
    setTotalClasses(student.totalClasses)
    setPresentClasses(student.present)

    if (student.totalClasses > 0) {
      const percentage =
        (student.present / student.totalClasses) * 100

      setAttendance(percentage.toFixed(2))
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // DELETE
  const deleteStudent = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this student?'
    )

    if (!confirmDelete) {
      return
    }

    try {
      const response = await fetch(
        `http://localhost:5000/students/${id}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      alert('Student deleted successfully!')

      getStudents()
    } catch (error) {
      console.log('Delete error:', error)
      alert('Error deleting student')
    }
  }

  // DAILY ATTENDANCE
  const markAttendance = async (student, status) => {
    try {
      const currentDailyAttendance =
        student.dailyAttendance || {}

      const updatedDailyAttendance = {
        ...currentDailyAttendance,
        [selectedDate]: status
      }

      const response = await fetch(
        `http://localhost:5000/students/${student._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dailyAttendance: updatedDailyAttendance
          })
        }
      )

      if (!response.ok) {
        throw new Error('Attendance update failed')
      }

      await getStudents()

      alert(
        `${student.name} marked ${status} for ${selectedDate}`
      )
    } catch (error) {
      console.log('Attendance error:', error)
      alert('Error saving attendance')
    }
  }

  // SEARCH
  const filteredStudents = students.filter((student) => {
    const search = searchText.toLowerCase()

    return (
      student.name.toLowerCase().includes(search) ||
      student.registerNumber
        .toLowerCase()
        .includes(search)
    )
  })

  // DASHBOARD
  const totalStudents = students.length

  const eligibleStudents = students.filter((student) => {
    if (student.totalClasses === 0) {
      return false
    }

    const percentage =
      (student.present / student.totalClasses) * 100

    return percentage >= 75
  }).length

  const notEligibleStudents =
    totalStudents - eligibleStudents

  const averageAttendance =
    totalStudents > 0
      ? students.reduce((sum, student) => {
          if (student.totalClasses === 0) {
            return sum
          }

          return (
            sum +
            (student.present / student.totalClasses) * 100
          )
        }, 0) / totalStudents
      : 0

  return (
    <div className="app">

      {/* TITLE */}

      <h1 className="main-title">
        Attendance Management System
      </h1>

      {/* DASHBOARD */}

      <div className="dashboard">

        <div className="dashboard-card">
          <h3>Total Students</h3>
          <h2>{totalStudents}</h2>
        </div>

        <div className="dashboard-card">
          <h3>Eligible</h3>
          <h2>{eligibleStudents}</h2>
        </div>

        <div className="dashboard-card">
          <h3>Not Eligible</h3>
          <h2>{notEligibleStudents}</h2>
        </div>

        <div className="dashboard-card">
          <h3>Average Attendance</h3>
          <h2>{averageAttendance.toFixed(2)}%</h2>
        </div>

      </div>

      {/* STUDENT FORM */}

      <div className="card">

        <h2>
          {editId ? 'Edit Student' : 'Student Details'}
        </h2>

        <input
          type="text"
          placeholder="Enter Student Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Enter Register Number"
          value={registerNumber}
          onChange={(e) =>
            setRegisterNumber(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Enter Total Classes"
          value={totalClasses}
          onChange={(e) =>
            setTotalClasses(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Enter Present Classes"
          value={presentClasses}
          onChange={(e) =>
            setPresentClasses(e.target.value)
          }
        />

        <button
          className="calculate-button"
          onClick={saveStudent}
        >
          {editId
            ? 'Update Student'
            : 'Add Student'}
        </button>

        {editId && (
          <button
            className="cancel-button"
            onClick={clearForm}
          >
            Cancel
          </button>
        )}

        {attendance !== null && (
          <div className="result">

            <h3>
              Attendance Percentage
            </h3>

            <h1>
              {attendance}%
            </h1>

            <p
              className={
                Number(attendance) >= 75
                  ? 'eligible'
                  : 'not-eligible'
              }
            >
              {Number(attendance) >= 75
                ? 'Eligible'
                : 'Not Eligible'}
            </p>

          </div>
        )}

      </div>

      {/* SEARCH + DATE */}

      <div className="attendance-controls">

        <input
          type="date"
          value={selectedDate}
          onChange={(e) =>
            setSelectedDate(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Search by name or register number"
          value={searchText}
          onChange={(e) =>
            setSearchText(e.target.value)
          }
        />

      </div>

      {/* STUDENT TABLE */}

      <div className="student-list">

        <h2>
          Student Attendance List
        </h2>

        {filteredStudents.length === 0 ? (
          <p className="no-students">
            No students found.
          </p>
        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>Name</th>

                  <th>
                    Register Number
                  </th>

                  <th>
                    Total Classes
                  </th>

                  <th>
                    Present
                  </th>

                  <th>
                    Absent
                  </th>

                  <th>
                    Attendance
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Daily Attendance
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredStudents.map(
                  (student) => {

                    const percentage =
                      student.totalClasses > 0
                        ? (student.present /
                            student.totalClasses) *
                          100
                        : 0

                    const dailyStatus =
                      student.dailyAttendance?.[
                        selectedDate
                      ]

                    return (

                      <tr
                        key={student._id}
                      >

                        <td>
                          {student.name}
                        </td>

                        <td>
                          {student.registerNumber}
                        </td>

                        <td>
                          {student.totalClasses}
                        </td>

                        <td>
                          {student.present}
                        </td>

                        <td>
                          {student.absent}
                        </td>

                        <td>
                          {percentage.toFixed(2)}%
                        </td>

                        <td>

                          <span
                            className={
                              percentage >= 75
                                ? 'status eligible'
                                : 'status not-eligible'
                            }
                          >
                            {percentage >= 75
                              ? 'Eligible'
                              : 'Not Eligible'}
                          </span>

                        </td>

                        <td>

                          <div className="attendance-buttons">

                            <button
                              className="present-button"
                              onClick={() =>
                                markAttendance(
                                  student,
                                  'Present'
                                )
                              }
                            >
                              Present
                            </button>

                            <button
                              className="absent-button"
                              onClick={() =>
                                markAttendance(
                                  student,
                                  'Absent'
                                )
                              }
                            >
                              Absent
                            </button>

                          </div>

                          {dailyStatus && (
                            <small
                              className={
                                dailyStatus ===
                                'Present'
                                  ? 'present'
                                  : 'absent'
                              }
                            >
                              {dailyStatus}
                            </small>
                          )}

                        </td>

                        <td className="action-cell">

                          <button
                            className="edit-button"
                            onClick={() =>
                              editStudent(student)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteStudent(
                                student._id
                              )
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  )
}

export default App 