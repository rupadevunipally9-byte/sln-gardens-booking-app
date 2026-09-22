import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import { db } from './firebase';
import { ref, onValue, push, update, remove } from "firebase/database";

// Get date in local format: YYYY-MM-DD
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTileClass(date, bookings) {
  const dateStr = formatLocalDate(date);

  const bookingsForDate = bookings.filter(
    b => b.date === dateStr
  );
  const [darkMode, setDarkMode] = useState(false);
  

  if (bookingsForDate.length === 0) return '';

  let hasRed = false;
  let hasGreen = false;
  let hasBlue = false;
  let hasYellow = false;

  bookingsForDate.forEach(booking => {
    if (booking.status === 'completedNotPaid') {
      hasRed = true;
    } else if (booking.status === 'completedPaid') {
      hasGreen = true;
    } else if (booking.status === 'prepaid') {
      hasBlue = true;
    } else if (booking.status === 'call') {
      hasYellow = true;
    }
  });

  if (hasRed) return 'red-tile';
  if (hasGreen) return 'green-tile';
  if (hasBlue) return 'blue-tile';
  if (hasYellow) return 'yellow-tile';

  return '';
}

function BookingsTable({
  bookings,
  dateStr,
  onEdit,
  onComplete,
  onDelete
}) {
  const dateBookings = bookings.filter(
    b => b.date === dateStr
  );

  if (dateBookings.length === 0) return null;

  function isPastDate(dstr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dstr.split('-').map(Number);

    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);

    return d < today;
  }

  return (
    <div className="responsive-table-container">
      <h3>Bookings for {dateStr}</h3>

      <table className="responsive-table">

        <thead>
          <tr>
            <th>ID</th>
            <th>Event Type</th>
            <th>Customer Name</th>
            <th>Phone Number</th>
            <th>Note</th>
            <th>Status</th>
            <th>Payment Action</th>
            <th>Complete Event</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {dateBookings.map((b, idx) => {

            const past = isPastDate(b.date);

            let rowColor = '';

            if (b.status === 'prepaid') {
              rowColor = 'row-blue';
            } else if (b.status === 'call') {
              rowColor = 'row-yellow';
            } else if (b.status === 'completedPaid') {
              rowColor = 'row-green';
            } else if (b.status === 'completedNotPaid') {
              rowColor = 'row-red';
            }

            return (
              <tr
                key={b.key || idx}
                className={rowColor}
              >

                <td>{b.id}</td>

                <td>{b.type}</td>

                <td>{b.name}</td>

                {/* Optional phone */}
                <td>{b.phone || '—'}</td>

                {/* Optional note */}
                <td>{b.note || '—'}</td>

                <td>
                  {b.status === 'prepaid' &&
                    '💙 PAID (Booked)'}

                  {b.status === 'call' &&
                    '💛 Call Confirmed (Not Paid)'}

                  {b.status === 'completedPaid' &&
                    '💚 Completed & Paid'}

                  {b.status === 'completedNotPaid' &&
                    '❤️ Completed - PAYMENT PENDING'}
                </td>

                <td>
                  {(b.status === 'call' ||
                    b.status === 'prepaid') && (

                    <button
                      onClick={() => onEdit(b.key, b)}
                      className="primary-btn"
                    >
                      {b.status === 'call'
                        ? "Mark as Paid"
                        : "Mark as Not Paid"}
                    </button>
                  )}

                  {(b.status === 'completedPaid' ||
                    b.status === 'completedNotPaid') && (

                    <span style={{ color: '#666' }}>
                      Event Completed
                    </span>
                  )}
                </td>

                <td>

                  {(b.status === 'call' ||
                    b.status === 'prepaid') &&
                    past && (

                    <button
                      onClick={() => onComplete(b.key)}
                      className="success-btn"
                    >
                      Mark Complete
                    </button>
                  )}

                  {(b.status === 'call' ||
                    b.status === 'prepaid') &&
                    !past && (

                    <span
                      style={{
                        color: '#0d6efd',
                        fontWeight: 'bold'
                      }}
                    >
                      📅 Upcoming
                    </span>
                  )}

                  {(b.status === 'completedPaid' ||
                    b.status === 'completedNotPaid') && (

                    <span
                      style={{
                        color: '#198754',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓ Event Over
                    </span>
                  )}

                </td>

                <td>

                  <button
                    onClick={() => onDelete(b.key)}
                    className="danger-btn"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            );
          })}
        </tbody>

      </table>
    </div>
  );
}

function AddBookingForm({ dateStr, onAdd }) {

  const [type, setType] = useState("");
  const [name, setName] = useState("");

  // Optional fields
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [status, setStatus] = useState("call");

  const handleSubmit = (e) => {

    e.preventDefault();

    if (type.trim() && name.trim()) {

      onAdd({
        id: Date.now(),
        date: dateStr,
        type: type.trim(),
        name: name.trim(),

        // Optional fields
        phone: phone.trim(),
        note: note.trim(),

        status,
        paid: status === 'prepaid'
      });

      // Clear form
      setType("");
      setName("");
      setPhone("");
      setNote("");
      setStatus("call");
    }
  };

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}
    >

      <h3 style={{ fontSize: '1rem' }}>
        Add New Booking for {dateStr}
      </h3>

      <form onSubmit={handleSubmit}>

        <div className="responsive-form-row">

          {/* Event Type - Required */}
          <input
            value={type}
            onChange={e => setType(e.target.value)}
            placeholder="Marriage, Reception, Other"
            className="responsive-input"
            required
          />

          {/* Customer Name - Required */}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Customer Name"
            className="responsive-input"
            required
          />

          {/* Phone - Optional */}
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone Number (Optional)"
            className="responsive-input"
          />

          {/* Note - Optional */}
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (Optional)"
            className="responsive-input"
          />

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="responsive-input"
          >

            <option value="call">
              💛 Call Confirmed (Not Paid)
            </option>

            <option value="prepaid">
              💙 Prepaid
            </option>

          </select>

          {/* Add Button */}
          <button
            type="submit"
            className="success-btn"
          >
            Add Booking
          </button>

        </div>

      </form>

    </div>
  );
}

export default function App() {

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [bookings, setBookings] =
    useState([]);

  useEffect(() => {

    const bookingsRef = ref(db, 'bookings');

    onValue(bookingsRef, snapshot => {

      const val = snapshot.val();

      const bookingsList = [];

      if (val) {
        for (let key in val) {

          bookingsList.push({
            ...val[key],
            key
          });

        }
      }

      setBookings(bookingsList);
    });

  }, []);

  // FIXED: use local date instead of toISOString()
  const dateStr = formatLocalDate(selectedDate);

  const handleAdd = (booking) => {

    push(
      ref(db, 'bookings'),
      booking
    );

  };

  // Toggle between paid and not paid
  const handleEdit = (
    bookingKey,
    booking
  ) => {

    if (booking.status === "call") {

      update(
        ref(db, `bookings/${bookingKey}`),
        {
          status: 'prepaid',
          paid: true
        }
      );

    } else if (booking.status === "prepaid") {

      update(
        ref(db, `bookings/${bookingKey}`),
        {
          status: 'call',
          paid: false
        }
      );

    }
  };

  const handleComplete = (bookingKey) => {

    const b = bookings.find(
      bk => bk.key === bookingKey
    );

    if (!b) return;

    update(
      ref(db, `bookings/${bookingKey}`),
      {
        status: b.paid
          ? 'completedPaid'
          : 'completedNotPaid'
      }
    );

  };

  // DELETE event
  const handleDelete = (bookingKey) => {

    remove(
      ref(db, `bookings/${bookingKey}`)
    );

  };

  return (

    <div className={darkMode ? "main-wrap dark-mode" : "main-wrap"}>

      <h1 className="page-title">
  <img
    src="https://budhshiv.com/cdn/shop/collections/narsimha-lakshmi-459235.jpg?v=1780254573"
    alt="Narasimha Lakshmi"
    className="garden-logo"
  />
  SLN Gardens Event Booking 
</h1>

      <p className="ownername">
        Owner: Srinivas Devunipally
      </p>
      <button onClick={() => setDarkMode(!darkMode)}>
         {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
      <Calendar

        onClickDay={setSelectedDate}

        value={selectedDate}

        tileClassName={({ date, view }) =>
          view === 'month'
            ? getTileClass(date, bookings)
            : null
        }

      />

      <div>

        <p className="selected-date">

          <b>Selected Date:</b>{' '}

          {selectedDate.toDateString()}

        </p>

        <BookingsTable

          bookings={bookings}

          dateStr={dateStr}

          onEdit={handleEdit}

          onComplete={handleComplete}

          onDelete={handleDelete}

        />

        <AddBookingForm

          dateStr={dateStr}

          onAdd={handleAdd}

        />
             <p className="ownername">
        Handler: Rupa Devunipally
        Contact: rupadevunipally9@gmail.com
      </p>

      </div>

    </div>
  );
}
