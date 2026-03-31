import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  MapPin, Clock, LayoutGrid, CheckCircle2, Trash2, X
} from 'lucide-react';
import { supabase, supabaseConfigured, supabaseConfigError } from './supabaseClient';
import './Page3.css';

const EVENT_TYPES = [
  { id: 'date', label: 'Date', color: '#ffb5a7', icon: '❤️', softColor: '#ffb5a733' },
  { id: 'vacances', label: 'Vacances', color: '#a3e4d7', icon: '✈️', softColor: '#a3e4d733' },
  { id: 'autre', label: 'Autre', color: '#f9e79f', icon: '📌', softColor: '#f9e79f33' },
  { id: 'pro', label: 'Travail', color: '#d7bde2', icon: '💼', softColor: '#d7bde233' }
];

const getLocalDayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Page3() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'month', 'week', 'day'
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDayStr());
  const [showModal, setShowModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("date");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventDuration, setNewEventDuration] = useState("1");
  const [newEventRecurrence, setNewEventRecurrence] = useState("none");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null, dateStr: "" });

  const timeGridScrollRef = useRef(null);

  const publicBaseUrl = (import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin).replace(/\/$/, "");
  const calendarFeedUrl = `${publicBaseUrl}/api/calendar.ics`;

  if (!supabaseConfigured) {
    return (
      <div className="page3-layout">
        <header className="app-header">
          <Link to="/" className="app-back-btn"><ArrowLeft size={24} /></Link>
          <h1 className="app-title">Agenda</h1>
          <div className="app-header-actions" />
        </header>

        <div className="agenda-workspace" style={{ padding: 24 }}>
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div style={{ maxWidth: 520, textAlign: "center" }}>{supabaseConfigError}</div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Supabase Fetch & Real-time
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    fetchEvents();

    const subscription = supabase
      .channel('public:calendrier_evenements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendrier_evenements' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchEvents = async () => {
    if (!supabase) return;
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from('calendrier_evenements')
        .select('*');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Erreur de chargement des événements:", error);
      setErrorMsg(error?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const getWeekDays = (date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    }
    return week;
  };

  const isEventOnDate = (event, checkDateStr) => {
    if (Array.isArray(event?.exceptions) && event.exceptions.includes(checkDateStr)) return false;
    if (!event.recurrence || event.recurrence === "none") return event.date === checkDateStr;
    const evDate = new Date(event.date);
    const ckDate = new Date(checkDateStr);
    
    evDate.setHours(0,0,0,0);
    ckDate.setHours(0,0,0,0);
    
    if (ckDate < evDate) return false;
    
    if (event.recurrence === "daily") return true;
    if (event.recurrence === "weekly") {
      return evDate.getDay() === ckDate.getDay();
    }
    if (event.recurrence === "monthly") {
      return evDate.getDate() === ckDate.getDate();
    }
    if (event.recurrence === "yearly") {
      return evDate.getDate() === ckDate.getDate() && evDate.getMonth() === ckDate.getMonth();
    }
    return event.date === checkDateStr;
  };

  const openCreateModalAt = ({ dateStr, minutesFromTop }) => {
    const safeMinutes = Math.max(0, Math.min((24 * 60) - 1, minutesFromTop));
    let hour = Math.floor(safeMinutes / 60);
    const minute = safeMinutes % 60;
    let roundedMinute = minute >= 30 ? 30 : 0;
    if (hour === 24) hour = 23;
    if (hour === 23 && roundedMinute === 30) roundedMinute = 30;

    const timeStr = `${String(hour).padStart(2, "0")}:${roundedMinute === 0 ? "00" : "30"}`;

    setSelectedDate(dateStr);
    setNewEventTitle("");
    setNewEventTime(timeStr);
    setNewEventDuration("1");
    setNewEventRecurrence("none");
    setShowModal(true);
  };

  const requestDeleteEvent = (ev, occurrenceDateStr) => {
    if (!ev) return;
    const isRecurring = Boolean(ev.recurrence && ev.recurrence !== "none");
    if (isRecurring) {
      setDeleteDialog({ open: true, event: ev, dateStr: occurrenceDateStr });
      return;
    }

    if (!confirm("Supprimer cet événement ?")) return;
    deleteEventRow(ev.id);
  };

  const deleteEventRow = async (eventId) => {
    try {
      const { error } = await supabase.from("calendrier_evenements").delete().eq("id", eventId);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e) {
      alert("Erreur lors de la suppression: " + (e?.message || "Erreur inconnue"));
    }
  };

  const deleteRecurringOccurrence = async (ev, dateStr) => {
    const currentExceptions = Array.isArray(ev?.exceptions) ? ev.exceptions.slice() : [];
    const nextExceptions = currentExceptions.includes(dateStr) ? currentExceptions : [...currentExceptions, dateStr];

    try {
      const { error } = await supabase
        .from("calendrier_evenements")
        .update({ exceptions: nextExceptions })
        .eq("id", ev.id);
      if (error) throw error;
      setEvents((prev) => prev.map((e) => (e.id === ev.id ? { ...e, exceptions: nextExceptions } : e)));
    } catch (e) {
      alert("Erreur lors de la suppression de l'occurrence: " + (e?.message || "Erreur inconnue"));
    }
  };

  // Nav
  const navigatePrev = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    else {
      const prevDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
      setCurrentDate(prevDay);
      setSelectedDate(getLocalDayStr(prevDay));
    }
  };
  const navigateNext = () => {
    if (view === 'month') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    else {
      const nextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      setCurrentDate(nextDay);
      setSelectedDate(getLocalDayStr(nextDay));
    }
  };
  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(getLocalDayStr(today));
  };

  const formatHeader = () => {
    if (view === 'month') return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (view === 'week') {
      const week = getWeekDays(currentDate);
      const start = week[0];
      const end = week[6];
      if (start.getMonth() === end.getMonth()) return `${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      return `${start.toLocaleDateString('fr-FR', { month: 'short' })} - ${end.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle || !selectedDate) return;

    try {
      const { data, error } = await supabase
        .from('calendrier_evenements')
        .insert([{
          date: selectedDate,
          title: newEventTitle,
          type: newEventType,
          time: newEventTime || null,
          duration: parseFloat(newEventDuration) || 1,
          recurrence: newEventRecurrence
        }])
        .select();

      if (error) throw error;
      
      setShowModal(false);
      setNewEventTitle(""); setNewEventTime(""); setNewEventDuration("1"); setNewEventRecurrence("none");
      const inserted = Array.isArray(data) ? data[0] : null;
      if (inserted) setEvents((prev) => [...prev, inserted]);
      else await fetchEvents();
    } catch (error) {
      alert("Erreur lors de l'ajout de l'événement: " + error.message);
    }
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentDate(new Date(dateStr));
  };

  const exportICS = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Nanamoureux//FR\nCALSCALE:GREGORIAN\n";
    
    events.forEach(ev => {
      const typeInfo = EVENT_TYPES.find(t => t.id === ev.type);
      const evDate = ev.date.replace(/-/g, ''); // YYYYMMDD
      
      ics += "BEGIN:VEVENT\n";
      ics += `UID:${ev.id}@nanamoureux\n`;
      ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      
      if (ev.time) {
        const [hh, mm] = ev.time.split(':');
        const dtStr = `${evDate.replace(/-/g, '')}T${hh}${mm}00`;
        ics += `DTSTART;TZID=Europe/Paris:${dtStr}\n`;
        const endH = parseInt(hh) + Math.floor(ev.duration);
        const endM = parseInt(mm) + ((ev.duration % 1) * 60);
        const dtEndStr = `${evDate.replace(/-/g, '')}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`;
        ics += `DTEND;TZID=Europe/Paris:${dtEndStr}\n`;
      } else {
        ics += `DTSTART;VALUE=DATE:${evDate.replace(/-/g, '')}\n`;
      }

      if (ev.recurrence && ev.recurrence !== 'none') {
        let freq = 'DAILY';
        if (ev.recurrence === 'weekly') freq = 'WEEKLY';
        if (ev.recurrence === 'monthly') freq = 'MONTHLY';
        if (ev.recurrence === 'yearly') freq = 'YEARLY';
        ics += `RRULE:FREQ=${freq}\n`;
      }
      
      ics += `SUMMARY:${ev.title} ${typeInfo ? typeInfo.icon : ''}\n`;
      ics += `DESCRIPTION:Catégorie: ${typeInfo ? typeInfo.label : ''}\n`;
      ics += "END:VEVENT\n";
    });
    
    ics += "END:VCALENDAR";
    
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'nanamoureux-calendrier.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERS ---
  const renderMonthGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const totalSlots = blanks.length + days.length;
    const remainingSlots = (Math.ceil(totalSlots / 7) * 7) - totalSlots;
    const endBlanks = Array(remainingSlots).fill(null);
    
    const allSlots = [...blanks, ...days, ...endBlanks];
    const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    
    return (
      <div className="premium-month-grid">
        <div className="weekdays-row">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(day => (
            <div key={day} className="weekday-header-cell">{day}</div>
          ))}
        </div>
        
        <div className="days-grid-wrapper">
          {allSlots.map((day, ix) => {
            let isCurrentMonth = true;
            let displayDay = day;
            let currentDayStr = "";
            let isWeekend = (ix % 7 === 5) || (ix % 7 === 6);
            
            if (!day) {
              isCurrentMonth = false;
              if (ix < firstDay) {
                displayDay = prevMonthDays - firstDay + ix + 1;
                const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, displayDay);
                currentDayStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
              } else {
                displayDay = ix - totalSlots + 1;
                const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, displayDay);
                currentDayStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(displayDay).padStart(2, '0')}`;
              }
            } else {
              currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }

            const dayEvents = events.filter(e => isEventOnDate(e, currentDayStr));
            const isToday = currentDayStr === getLocalDayStr();
            const isSelected = currentDayStr === selectedDate;

            return (
              <div 
                key={ix} 
                className={`premium-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${!isCurrentMonth ? 'is-other-month' : ''} ${isWeekend ? 'is-weekend' : ''}`}
                onClick={() => handleDayClick(currentDayStr)}
              >
                <div className="day-number-wrapper">
                  <span className="day-number">{displayDay}</span>
                </div>
                
                <div className="day-indicators">
                  {isMobile ? (
                    dayEvents.slice(0, 4).map(ev => {
                      const typeInfo = EVENT_TYPES.find(t => t.id === ev.type);
                      return <div key={ev.id} className="event-dot" style={{ backgroundColor: typeInfo?.color }} />;
                    })
                  ) : (
                    dayEvents.slice(0, 3).map(ev => {
                      const typeInfo = EVENT_TYPES.find(t => t.id === ev.type);
                      return (
                        <div key={ev.id} className="event-mini-bar" style={{ backgroundColor: typeInfo?.softColor, borderLeftColor: typeInfo?.color, color: typeInfo?.color }}>
                          <span className="event-time-txt">{ev.time}</span> {ev.title}
                        </div>
                      );
                    })
                  )}
                  {!isMobile && dayEvents.length > 3 && (
                    <div className="event-more-txt">+{dayEvents.length - 3} de plus</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaList = () => {
    const selectedDateEvents = events.filter(e => isEventOnDate(e, selectedDate));
    const dateTitle = new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const isToday = selectedDate === getLocalDayStr();

    return (
      <div className="premium-agenda-list">
        <h3 className="agenda-list-header">
          {isToday ? 'Aujourd\'hui' : dateTitle}
        </h3>
        
        {loading ? (
             <div className="empty-state">Chargement...</div>
        ) : selectedDateEvents.length === 0 ? (
          <div className="empty-state">
             <div className="empty-icon">🍵</div>
             <p>Rien de prévu, profitez-en !</p>
          </div>
        ) : (
          <div className="agenda-items">
            {selectedDateEvents.map(ev => {
              const typeInfo = EVENT_TYPES.find(t => t.id === ev.type);
              return (
                <div key={ev.id} className="agenda-item-card" style={{ '--event-color': typeInfo?.color, '--event-bg': typeInfo?.softColor }}>
                  <div className="ac-time">
                    {ev.time ? (
                      <>
                        <span className="ac-t-main">{ev.time}</span>
                        {ev.duration && (
                          <span className="ac-t-sub">{Math.floor(parseFloat(ev.time) + (ev.duration||1))}:{String(parseFloat(ev.time) % 1 > 0 ? 30 : '00').padStart(2,'0')}</span>
                        )}
                      </>
                    ) : (
                      <span className="ac-t-all">Toute la j.</span>
                    )}
                  </div>
                  <div className="ac-divider" style={{ backgroundColor: typeInfo?.color }}></div>
                  <div className="ac-content">
                    <div className="ac-title">{ev.title}</div>
                    <div className="ac-type">
                      <span className="ac-icon">{typeInfo?.icon}</span> {typeInfo?.label}
                    </div>
                  </div>
                  <div className="ac-actions">
                    <button
                      className="ac-action-btn"
                      onClick={() => requestDeleteEvent(ev, selectedDate)}
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTimeGrid = (daysToRender) => {
    return (
      <div className="premium-time-grid">
        <div className="tg-header">
          <div className="tg-time-axis-spacer"></div>
          {daysToRender.map((date, i) => {
            const dateStr = getLocalDayStr(date);
            const isToday = dateStr === getLocalDayStr();
            const isSelected = dateStr === selectedDate;
            
            return (
              <div key={i} className={`tg-day-header ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`} onClick={() => handleDayClick(dateStr)}>
                <div className="tg-day-name">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                <div className={`tg-day-num`}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="tg-all-day-row">
          <div className="tg-time-axis-spacer"></div>
          {daysToRender.map((date, i) => {
            const dateStr = getLocalDayStr(date);
            const dayEvents = events.filter((e) => isEventOnDate(e, dateStr));
            const allDay = dayEvents.filter((ev) => !ev.time);
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={`ad-${i}`}
                className={`tg-all-day-cell ${isSelected ? "is-selected" : ""}`}
                onClick={() => handleDayClick(dateStr)}
              >
                {allDay.slice(0, 2).map((ev) => {
                  const typeInfo = EVENT_TYPES.find((t) => t.id === ev.type);
                  return (
                    <div
                      key={`ad-chip-${ev.id}`}
                      className="tg-ad-chip"
                      style={{
                        backgroundColor: typeInfo?.softColor,
                        borderLeftColor: typeInfo?.color,
                      }}
                      title={ev.title}
                    >
                      <span className="tg-ad-title">{ev.title}</span>
                      <button
                        className="tg-ad-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteEvent(ev, dateStr);
                        }}
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
                {allDay.length > 2 ? <div className="tg-ad-more">+{allDay.length - 2}</div> : null}
              </div>
            );
          })}
        </div>
        
        <div className="tg-body" ref={timeGridScrollRef}>
          <div className="tg-time-axis">
            {HOURS.map(hour => (
              <div key={hour} className="tg-time-label">
                <span>{hour}:00</span>
              </div>
            ))}
          </div>
          
          <div className="tg-day-columns">
            {HOURS.map(hour => (
              <div key={`gl-${hour}`} className="tg-grid-line" style={{ top: `${hour * 60}px` }}></div>
            ))}
            
            {daysToRender.some(d => getLocalDayStr(d) === getLocalDayStr()) && (
              <div className="tg-current-time" style={{ top: `${(new Date().getHours() * 60) + new Date().getMinutes()}px` }}>
                 <div className="tg-ct-dot"></div>
              </div>
            )}

            {daysToRender.map((date, i) => {
              const dateStr = getLocalDayStr(date);
              const dayEvents = events.filter(e => isEventOnDate(e, dateStr));
              
              return (
                <div key={i} className={`tg-day-column ${dateStr === getLocalDayStr() ? 'is-today-col' : ''}`}>
                  <div
                    className="tg-click-layer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = (e.clientY - rect.top) + (timeGridScrollRef.current?.scrollTop || 0);
                      handleDayClick(dateStr);
                      openCreateModalAt({ dateStr, minutesFromTop: y });
                    }}
                  />
                  {dayEvents.filter(ev => ev.time).map(ev => {
                    const [hours, minutes] = ev.time.split(':').map(Number);
                    const topPos = (hours * 60) + minutes;
                    const height = (ev.duration || 1) * 60;
                    const typeInfo = EVENT_TYPES.find(t => t.id === ev.type);
                    
                    return (
                      <div 
                        key={ev.id} 
                        className="tg-event-block"
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          top: `${topPos}px`, 
                          height: `${Math.max(30, height)}px`,
                          backgroundColor: typeInfo?.softColor,
                          borderLeftColor: typeInfo?.color,
                          color: '#2d3748'
                        }}
                      >
                        <button
                          className="tg-ev-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteEvent(ev, dateStr);
                          }}
                          title="Supprimer"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="tg-ev-title">{ev.title}</div>
                        <div className="tg-ev-time">{ev.time}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page3-layout">
      <header className="app-header">
        <Link to="/" className="app-back-btn"><ArrowLeft size={24} /></Link>
        <h1 className="app-title">Agenda</h1>
        <div className="app-header-actions">
          <button 
            className="at-btn-today" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowSyncModal(true)}
          >
            <span style={{ fontSize: '16px' }}>🔗</span> Synchroniser
          </button>
        </div>
      </header>

      <div className="agenda-workspace">
        {errorMsg && (
          <div className="empty-state" style={{ margin: "12px 0" }}>
            <div style={{ maxWidth: 520, textAlign: "center" }}>Erreur Supabase : {errorMsg}</div>
          </div>
        )}
        <div className="agenda-toolbar-premium">
          <div className="at-left">
            <button className="at-btn-today" onClick={navigateToday}>Aujourd'hui</button>
            <div className="at-nav-group">
              <button className="at-icon-btn" onClick={navigatePrev}><ChevronLeft size={20}/></button>
              <button className="at-icon-btn" onClick={navigateNext}><ChevronRight size={20}/></button>
            </div>
            <h2 className="at-date-title">{formatHeader()}</h2>
          </div>
          
          <div className="at-view-tabs">
            <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Jour</button>
            <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Semaine</button>
            <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Mois</button>
          </div>
        </div>

        <div className="agenda-main-area">
          {view === 'month' && (
            <div className={`month-view-layout ${isMobile ? 'is-mobile' : 'is-desktop'}`}>
              <div className="mv-calendar-pane" style={{ borderRight: 'none' }}>
                {renderMonthGrid()}
              </div>
            </div>
          )}

          {view === 'week' && renderTimeGrid(getWeekDays(currentDate))}
          
          {view === 'day' && (
            <div className="day-view-layout">
              <div className="dv-time-pane">
                {renderTimeGrid([new Date(selectedDate)])}
              </div>
              {!isMobile && (
                <div className="dv-agenda-pane">
                  <div className="mini-calendar">
                     {renderAgendaList()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <button className="fab-add-event" onClick={() => setShowModal(true)}>
        <Plus size={28} />
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvel Événement</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddEvent} className="premium-form">
              <input 
                type="text" 
                className="pf-input-title"
                autoFocus
                placeholder="Titre de l'événement" 
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                required
              />

              <div className="pf-section">
                <div className="pf-row">
                  <Clock size={20} className="pf-icon" />
                  <div className="pf-inputs">
                    <input 
                      type="date" 
                      className="pf-date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      required
                    />
                    <input 
                      type="time" 
                      className="pf-time"
                      value={newEventTime}
                      onChange={e => setNewEventTime(e.target.value)}
                    />
                  </div>
                </div>
                {newEventTime && (
                  <div className="pf-row pf-sub-row">
                    <div className="pf-icon placeholder" />
                    <div className="pf-inputs">
                      <select 
                        value={newEventDuration}
                        onChange={e => setNewEventDuration(e.target.value)}
                        className="pf-select"
                      >
                        <option value="0.5">30 min</option>
                        <option value="1">1 heure</option>
                        <option value="1.5">1h 30</option>
                        <option value="2">2 heures</option>
                        <option value="3">3 heures</option>
                        <option value="4">Demi-journée</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pf-section">
                <div className="pf-row">
                  <LayoutGrid size={20} className="pf-icon" />
                  <div className="pf-bubbles">
                    {EVENT_TYPES.map(t => (
                      <div 
                        key={t.id}
                        className={`pf-bubble ${newEventType === t.id ? 'active' : ''}`}
                        onClick={() => setNewEventType(t.id)}
                        style={{ backgroundColor: newEventType === t.id ? t.softColor : 'transparent', borderColor: newEventType === t.id ? t.color : '#e2e8f0' }}
                      >
                        {t.icon} {t.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pf-row pf-sub-row" style={{ marginTop: '24px' }}>
                  <div className="pf-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔄</div>
                  <div className="pf-inputs">
                    <select 
                      value={newEventRecurrence}
                      onChange={e => setNewEventRecurrence(e.target.value)}
                      className="pf-select"
                    >
                      <option value="none">Une seule fois</option>
                      <option value="daily">Chaque jour</option>
                      <option value="weekly">Chaque semaine</option>
                      <option value="monthly">Chaque mois</option>
                      <option value="yearly">Chaque année</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pf-actions">
                <button type="submit" className="pf-btn-submit">
                  Enregistrer l'événement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="modal-overlay" onClick={() => setShowSyncModal(false)}>
          <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Synchroniser l'Agenda</h3>
              <button className="modal-close-btn" onClick={() => setShowSyncModal(false)}><X size={24}/></button>
            </div>
            
            <div className="premium-form" style={{ paddingBottom: '32px' }}>
              <p style={{ color: 'var(--agenda-text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
                Pour afficher ce calendrier Nanamoureux dans <strong>Proton Calendar</strong>, <strong>Outlook</strong> ou <strong>Apple Calendar</strong>, vous avez besoin du format <code>.ics</code>.
              </p>

              <div className="pf-section" style={{ backgroundColor: 'rgba(255, 181, 167, 0.1)', border: '1px solid var(--color-primary)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--agenda-text-dark)' }}>1. Lien en direct (Auto-sync)</h4>
                <p style={{ fontSize: '13px', color: 'var(--agenda-text-muted)', margin: '0 0 12px 0' }}>
                  Abonnez-vous à ce lien dans Proton Calendar / Outlook. Le calendrier se mettra à jour tout seul.
                  <br/><i style={{ fontSize: '11px' }}>Note : si tu as configuré `CALENDAR_FEED_TOKEN` sur Vercel, ajoute `?token=...` à la fin de l’URL.</i>
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    className="pf-date" 
                    value={calendarFeedUrl}
                    style={{ flex: 1, backgroundColor: 'var(--bg-card)' }}
                  />
                  <button 
                    className="at-btn-today" 
                    onClick={() => {
                      navigator.clipboard.writeText(calendarFeedUrl);
                      alert("Lien copié ! Vous pouvez le coller dans Proton Calendar / Outlook → Ajouter par URL.");
                    }}
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div className="pf-section" style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--agenda-text-dark)' }}>2. Exporter manuellement</h4>
                <p style={{ fontSize: '13px', color: 'var(--agenda-text-muted)', margin: '0 0 12px 0' }}>
                  Téléchargez un fichier à importer une seule fois dans votre calendrier externe.
                </p>
                <button className="pf-btn-submit" onClick={exportICS}>
                  📥 Télécharger le fichier .ics
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {deleteDialog.open && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteDialog({ open: false, event: null, dateStr: "" })}
        >
          <div className="modal-content premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Supprimer l’événement</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteDialog({ open: false, event: null, dateStr: "" })}
                aria-label="Fermer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="premium-form" style={{ paddingBottom: 28 }}>
              <p style={{ color: "var(--agenda-text-muted)", lineHeight: 1.5, marginTop: 0 }}>
                “{deleteDialog.event?.title}” est un événement récurrent. Que veux-tu supprimer ?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <button
                  className="pf-btn-submit"
                  onClick={async () => {
                    const ev = deleteDialog.event;
                    const dateStr = deleteDialog.dateStr;
                    setDeleteDialog({ open: false, event: null, dateStr: "" });
                    await deleteRecurringOccurrence(ev, dateStr);
                  }}
                >
                  Supprimer uniquement ce jour
                </button>
                <button
                  className="pf-btn-submit"
                  style={{ background: "#ff5252", boxShadow: "0 8px 20px rgba(255, 82, 82, 0.25)" }}
                  onClick={async () => {
                    const ev = deleteDialog.event;
                    setDeleteDialog({ open: false, event: null, dateStr: "" });
                    await deleteEventRow(ev.id);
                  }}
                >
                  Supprimer toutes les répétitions
                </button>
                <button
                  className="at-btn-today"
                  style={{ width: "100%", padding: 14, borderRadius: 16 }}
                  onClick={() => setDeleteDialog({ open: false, event: null, dateStr: "" })}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
