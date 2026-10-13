/**
 * data.js — backend-backed data layer
 *
 * All survey data (built-in + admin-created), responses, and auth now live
 * in the Node/Express backend (see server/). This file is a thin proxy so
 * every page can keep using the same window.DB.list()/get() interface it
 * always has.
 */

window.DB = {
  /**
   * Returns survey list (no questions — for cards grid)
   */
  async list() {
    const r = await fetch('/api/surveys');
    if (!r.ok) return [];
    return r.json();
  },

  /**
   * Returns single survey with full question data
   */
  async get(id) {
    const r = await fetch('/api/surveys/' + encodeURIComponent(id));
    if (!r.ok) return null;
    return r.json();
  }
};
