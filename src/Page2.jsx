import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Check, Trash2, Pencil } from "lucide-react";
import { supabase } from "./supabaseClient";
import "./Page2.css";

const CATEGORIES = [
  { id: "Surgelé", label: "❄️ Surgelé", color: "#fafafaff" },
  { id: "Frais", label: "🥦 Frais", color: "#a3e4d7" },
  { id: "Autres", label: "🍝 Autres", color: "#f9e79f" },
  { id: "Plaisir", label: "🍫 Plaisirs ❤️", color: "#ffb5a7" },
  { id: "Ménager", label: "🧻 Ménager", color: "#a90eebff" },
];

export default function Page2() {
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [activeCategory, setActiveCategory] = useState("Frais");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Charger les données de Supabase au montage
  useEffect(() => {
    fetchItems();

    // Optionnel: Real-time subscription
    const subscription = supabase
      .channel('public:courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Erreur de chargement:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([{ 
          text: inputValue.trim(), 
          category: activeCategory, 
          completed: false 
        }])
        .select();

      if (error) throw error;
      setInputValue("");
    } catch (error) {
      alert("Erreur lors de l'ajout: " + error.message);
    }
  };

  const toggleItem = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      alert("Erreur lors du changement de statut: " + error.message);
    }
  };

  const deleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      alert("Erreur lors de la suppression: " + error.message);
    }
  };

  const startEdit = (id, text, category) => {
    setEditingId(id);
    setEditValue(text);
    setEditCategory(category);
  };

  const saveEdit = async (id) => {
    if (editValue.trim() === "") return;
    try {
      const { error } = await supabase
        .from('courses')
        .update({ text: editValue.trim(), category: editCategory })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
    } catch (error) {
      alert("Erreur lors de la modification: " + error.message);
    }
  };

  const clearCompleted = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('completed', true);

      if (error) throw error;
    } catch (error) {
      alert("Erreur lors du nettoyage: " + error.message);
    }
  };

  const activeItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return (
    <div className="page2-container">
      {/* Header */}
      <header className="page-header">
        <Link to="/" className="back-button">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="page-title">Nos Courses 🛒</h1>
      </header>

      {/* Add Item Form */}
      <form className="add-item-form" onSubmit={handleAddItem}>
        <div className="input-row">
          <input
            type="text"
            className="item-input"
            placeholder="Ajouter un truc..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="add-btn">
            <Plus size={24} />
          </button>
        </div>

        <div className="category-row">
          {CATEGORIES.map(cat => (
            <div
              key={cat.id}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </div>
          ))}
        </div>
      </form>

      {/* Active Items */}
      <div className="list-section-title">
        <span>À acheter ({activeItems.length})</span>
      </div>

      {loading ? (
        <div className="empty-state">Chargement...</div>
      ) : activeItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <div>Le frigo est plein !</div>
        </div>
      ) : (
        <div className="items-list">
          {activeItems.map(item => (
            <div key={item.id} className="item-card">
              {editingId !== item.id && (
                <div className="checkbox" onClick={() => toggleItem(item.id, item.completed)}>
                  {item.completed && <Check size={16} />}
                </div>
              )}
              <div className="item-content">
                {editingId === item.id ? (
                  <>
                    <input
                      type="text"
                      className="edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(item.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <div className="edit-category-row">
                      {CATEGORIES.map(cat => (
                        <div
                          key={cat.id}
                          className={`category-pill edit-pill ${editCategory === cat.id ? 'active' : ''}`}
                          onClick={() => setEditCategory(cat.id)}
                        >
                          {cat.label}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="item-name">{item.text}</div>
                    <div className="item-category">
                      {CATEGORIES.find(c => c.id === item.category)?.label}
                    </div>
                  </>
                )}
              </div>
              {editingId === item.id ? (
                <button className="save-edit-btn" onClick={() => saveEdit(item.id)}>
                  <Check size={20} />
                </button>
              ) : (
                <>
                  <button className="modif-btn" onClick={() => startEdit(item.id, item.text, item.category)}>
                    <Pencil size={18} />
                  </button>
                  <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <>
          <div className="list-section-title">
            <span>Déjà dans le panier</span>
            <button className="clear-completed" onClick={clearCompleted}>
              Vider
            </button>
          </div>

          <div className="items-list">
            {completedItems.map(item => (
              <div key={item.id} className="item-card completed">
                <div className="checkbox" onClick={() => toggleItem(item.id, item.completed)}>
                  <Check size={16} />
                </div>
                <div className="item-content">
                  <div className="item-name">{item.text}</div>
                </div>
                <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
