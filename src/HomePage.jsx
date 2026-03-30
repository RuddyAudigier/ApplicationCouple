import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { Heart, ShoppingBag, Calendar, ImageIcon, Lightbulb, PieChart, Home, MessageCircle, Settings, Plus, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [greeting, setGreeting] = useState("Bonjour les amoureux ☀️");
  const [budgetFill, setBudgetFill] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bonjour les amoureux ☀️");
    else if (hour < 18) setGreeting("Bonne aprèm ☕");
    else setGreeting("Bonsoir les amoureux 🌙");
    
    // Animate budget fill on mount
    setTimeout(() => setBudgetFill(45), 300);
  }, []);

  const budgetColorClass = budgetFill < 50 ? 'safe' : budgetFill < 80 ? 'warning' : 'danger';

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1 className="greeting-text">{greeting}</h1>
        <div className="avatars">
          <div className="avatar" style={{ background: 'linear-gradient(45deg, #ffb5a7, #ffc3a0)' }}></div>
          <div className="avatar" style={{ background: 'linear-gradient(45deg, #a3e4d7, #85c1e9)' }}></div>
        </div>
      </header>

      <div className="dashboard-grid">
        
        {/* PAGE 1 : Petit Mot (Wide) */}
        <Link to="/page1" className="feature-card wide widget-mot breathing">
          <div className="mot-label">
            <Heart size={16} color="var(--color-primary)" fill="var(--color-primary)" />
            <span>Défi du jour</span>
          </div>
          <div className="mot-content">
            Préparer le thé de l'autre ce soir 🍵
          </div>
          <div className="fab-icon">
            <ChevronRight size={24} />
          </div>
        </Link>

        {/* PAGE 2 : Logistique / Courses */}
        <Link to="/page2" className="feature-card widget-small">
          <div className="icon-wrapper icon-shopping">
            <ShoppingBag size={28} />
          </div>
          <div>
            <div className="widget-title">Courses</div>
            <div className="widget-subtitle">3 articles</div>
          </div>
        </Link>
        
        {/* PAGE 3 : Calendrier */}
        <Link to="/page3" className="feature-card widget-small">
          <div className="icon-wrapper icon-calendar">
            <Calendar size={28} />
          </div>
          <div>
            <div className="widget-title">Agenda</div>
            <div className="widget-subtitle">Dîner resto (Ven.)</div>
          </div>
        </Link>

        {/* PAGE 4 : Galerie / Souvenirs */}
        <Link to="/page4" className="feature-card widget-small">
          <div className="icon-wrapper icon-gallery">
            <ImageIcon size={28} />
          </div>
          <div>
            <div className="widget-title">Souvenirs</div>
            <div className="widget-subtitle">45 photos</div>
          </div>
        </Link>

        {/* PAGE 5 : Idées de Dates */}
        <Link to="/page5" className="feature-card widget-small">
          <div className="icon-wrapper icon-ideas">
            <Lightbulb size={28} />
          </div>
          <div>
            <div className="widget-title">Idées Dates</div>
            <div className="widget-subtitle">Nouvelle idée !</div>
          </div>
        </Link>

        {/* PAGE 6 : Budget Couple (Wide) */}
        <Link to="/page6" className="feature-card wide widget-budget">
          <div className="budget-header">
            <span className="budget-title">
              <PieChart size={18} color="var(--text-light)" />
              Budget Commun
            </span>
            <span className="budget-amount">Reste 320€</span>
          </div>
          <div className="liquid-gauge-container">
            <div className={`liquid-fill ${budgetColorClass}`} style={{ width: `${budgetFill}%` }}></div>
          </div>
        </Link>

      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item active">
          <Home size={24} />
        </Link>
        <div className="nav-item" onClick={() => alert("Bientôt disponible : messagerie de couple ❤️")} style={{cursor: 'pointer'}}>
          <MessageCircle size={24} />
        </div>
        <div className="nav-item" onClick={() => alert("Bientôt disponible : paramètres de l'application ⚙️")} style={{cursor: 'pointer'}}>
          <Settings size={24} />
        </div>
      </nav>
    </div>
  );
}
