import React, { useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaClock, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';

export default function PremiumDateTimePicker({ value, onChange, themeColor = '#f97316' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date(value || new Date()));
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleString([], { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectDate = (day) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(viewDate.getFullYear());
    newDate.setMonth(viewDate.getMonth());
    newDate.setDate(day);
    setSelectedDate(newDate);
    if (onChange) onChange(newDate.toISOString().slice(0, 16));
  };

  const updateTime = (type, val) => {
    const newDate = new Date(selectedDate);
    if (type === 'h') newDate.setHours(parseInt(val));
    if (type === 'm') newDate.setMinutes(parseInt(val));
    setSelectedDate(newDate);
    if (onChange) onChange(newDate.toISOString().slice(0, 16));
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="premium-dt-picker" ref={wrapperRef}>
      <div className={`dt-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <FaCalendarAlt className="dt-icon" />
        <span className="dt-value">{formatDate(selectedDate)}</span>
        <FaChevronDown className={`dt-chevron ${isOpen ? 'up' : ''}`} />
      </div>

      {isOpen && (
        <div className="dt-dropdown">
          <div className="dt-calendar">
            <div className="cal-hdr">
              <button onClick={handlePrevMonth}><FaChevronLeft /></button>
              <span>{viewDate.toLocaleString([], { month: 'long', year: 'numeric' })}</span>
              <button onClick={handleNextMonth}><FaChevronRight /></button>
            </div>
            <div className="cal-grid">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="day-name">{d}</div>
              ))}
              {blanks.map(b => <div key={`b-${b}`} className="day empty" />)}
              {days.map(d => {
                const isSelected = selectedDate.getDate() === d && 
                                 selectedDate.getMonth() === viewDate.getMonth() && 
                                 selectedDate.getFullYear() === viewDate.getFullYear();
                return (
                  <div 
                    key={d} 
                    className={`day ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectDate(d)}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dt-time">
            <div className="time-hdr"><FaClock /> Time Selection</div>
            <div className="time-selectors">
              <div className="time-col">
                {hours.map(h => (
                  <div 
                    key={h} 
                    className={`t-cell ${parseInt(h) === selectedDate.getHours() ? 'on' : ''}`}
                    onClick={() => updateTime('h', h)}
                  >
                    {h}
                  </div>
                ))}
              </div>
              <div className="time-sep">:</div>
              <div className="time-col">
                {minutes.map(m => (
                  <div 
                    key={m} 
                    className={`t-cell ${parseInt(m) === selectedDate.getMinutes() ? 'on' : ''}`}
                    onClick={() => updateTime('m', m)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
            <button className="now-btn" onClick={() => {
              const n = new Date();
              setSelectedDate(n);
              if (onChange) onChange(n.toISOString().slice(0, 16));
              setIsOpen(false);
            }}>Set to Current Moment</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .premium-dt-picker { position: relative; width: 100%; max-width: 240px; }
        .dt-trigger {
          background: #fff;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.2s;
          user-select: none;
        }
        .dt-trigger:hover { border-color: ${themeColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .dt-trigger.active { border-color: ${themeColor}; box-shadow: 0 0 0 3px ${themeColor}20; }
        .dt-icon { color: ${themeColor}; font-size: 12px; }
        .dt-value { font-size: 12px; font-weight: 800; color: #000; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dt-chevron { font-size: 9px; color: #94a3b8; transition: 0.2s; }
        .dt-chevron.up { transform: rotate(180deg); }

        .dt-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 15px 40px rgba(0,0,0,0.12);
          z-index: 1000;
          display: flex;
          overflow: hidden;
          animation: slideUp 0.15s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        .dt-calendar { padding: 14px; border-right: 1px solid #f1f5f9; width: 220px; }
        .cal-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .cal-hdr span { font-weight: 800; font-size: 12px; color: #000; }
        .cal-hdr button { border: none; background: #f8fafc; color: #000; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; font-size: 10px; }
        .cal-hdr button:hover { background: ${themeColor}; color: #fff; }

        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
        .day-name { font-size: 9px; font-weight: 800; color: #94a3b8; text-align: center; padding: 4px 0; }
        .day { height: 28px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #475569; border-radius: 6px; cursor: pointer; transition: 0.2s; }
        .day:hover:not(.empty) { background: #f1f5f9; color: #000; }
        .day.selected { background: ${themeColor}; color: #fff; font-weight: 800; box-shadow: 0 4px 8px ${themeColor}30; }
        .day.empty { cursor: default; }

        .dt-time { width: 130px; background: #fcfcfc; display: flex; flex-direction: column; }
        .time-hdr { padding: 12px; font-size: 10px; font-weight: 900; color: #000; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px; }
        .time-selectors { display: flex; flex: 1; height: 160px; }
        .time-col { flex: 1; overflow-y: auto; scrollbar-width: none; }
        .time-col::-webkit-scrollbar { display: none; }
        .t-cell { height: 32px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
        .t-cell:hover { background: #f1f5f9; color: #000; }
        .t-cell.on { color: ${themeColor}; font-weight: 900; background: ${themeColor}08; }
        .time-sep { display: flex; align-items: center; color: #cbd5e1; font-weight: 300; font-size: 10px; }
        
        .now-btn { margin: 8px; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #000; font-size: 10px; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .now-btn:hover { border-color: ${themeColor}; color: ${themeColor}; background: ${themeColor}05; }
      `}</style>
    </div>
  );
}
