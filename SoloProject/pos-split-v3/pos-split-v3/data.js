// ============================================================
//  data.js — localStorage 데이터 헬퍼
//  pos_p: 상품 | pos_c: 카테고리 | pos_h: 판매기록
// ============================================================

const gP=()=>JSON.parse(localStorage.getItem('pos_p')||'[]');
const gC=()=>JSON.parse(localStorage.getItem('pos_c')||'[]');
const gH=()=>JSON.parse(localStorage.getItem('pos_h')||'[]');
const sP=d=>localStorage.setItem('pos_p',JSON.stringify(d));
const sC=d=>localStorage.setItem('pos_c',JSON.stringify(d));
const sH=d=>localStorage.setItem('pos_h',JSON.stringify(d));