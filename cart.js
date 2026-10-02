export const getCart = () => { try { return JSON.parse(localStorage.getItem('cart') || '{}'); } catch { return {}; } };
export const saveCart = (c) => { try { localStorage.setItem('cart', JSON.stringify(c)); } catch {} };
