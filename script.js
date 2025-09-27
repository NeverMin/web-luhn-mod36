// Luhn Mod-36 implementation and UI logic
// Final Format: AAAxxxxxxxxxxxxc-yyy
// AAA: 3 uppercase country code letters
// x: 12 lowercase letters or digits
// c: checksum over (x12 + yyy) => 12 + 3 = 15 symbols using Luhn Mod-36
// yyy: 3 lowercase letters or digits

(function(){
  const reFormat = /^([A-Z]{3})([a-z0-9]{12})([0-9A-Za-z])-([a-z0-9]{3})$/;
  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // checksum still uses 36 set
  const valMap = Object.fromEntries(digits.split('').map((c,i)=>[c,i]));

  function charToVal(ch){
    return valMap[ch] ?? -1;
  }
  function valToChar(v){
    return digits[v];
  }

  // Luhn mod-36: process string right-to-left; double every second (index from 0) char value; if >=36 subtract 35.
  function luhnMod36Checksum(seq){
    let sum = 0;
    // Right to left
    for(let i=seq.length-1, pos=0; i>=0; i--, pos++){
      let v = charToVal(seq[i]);
      if(v < 0) throw new Error('非法字符');
      if(pos % 2 === 0){ // even position from right (0-based) => double
        v = v * 2;
        if(v >= 36) v -= 35; // v = (v % 36) + 1  equivalently subtract 35
      }
      sum += v;
    }
    const checkVal = (36 - (sum % 36)) % 36;
    return valToChar(checkVal);
  }

  function validateFormat(id){
    return reFormat.test(id);
  }

  function computeExpectedChecksum(id){
    const m = id.match(reFormat);
    if(!m) return null;
  const body = m[2]; // 12
    const C = m[3];
    const tail = m[4]; // 3
  const seq = (body + tail).toUpperCase(); // 12 + 3 = 15
    const expected = luhnMod36Checksum(seq);
    return { provided: C.toUpperCase(), expected };
  }

  function randomChars(len, type){
    const pool = type === 'A' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s='';
    for(let i=0;i<len;i++) s += pool[Math.floor(Math.random()*pool.length)];
    return s;
  }

  // Generate ID: AAA(3 upper) + body(12 lower/digits) + checksum + '-' + tail(3 lower/digits)
  function generateId(A, B){
    let a = (A || randomChars(3,'A')).toUpperCase().replace(/[^A-Z]/g,'');
    if(a.length !== 3) a = randomChars(3,'A');
    let body = (B || randomChars(12,'B')).toLowerCase().replace(/[^a-z0-9]/g,'');
    if(body.length !== 12) body = randomChars(12,'B');
    const tail = randomChars(3,'B');
    const checksum = luhnMod36Checksum((body + tail).toUpperCase());
    return a + body + checksum + '-' + tail;
  }

  // UI wiring
  const inputId = document.getElementById('inputId');
  const btnValidate = document.getElementById('btnValidate');
  const validateResult = document.getElementById('validateResult');
  const btnGenerate = document.getElementById('btnGenerate');
  const genA = document.getElementById('genA');
  const genB = document.getElementById('genB');
  const generateResult = document.getElementById('generateResult');

  btnValidate.addEventListener('click', () => {
    let raw = inputId.value.trim();
    if(!raw){
      setResult(validateResult,'请输入 ID','err');
      return;
    }
    // Normalize casing: first 3 uppercase, rest (excluding checksum & dash) lowercase except checksum we allow any then uppercase in algorithm
    raw = normalizeInput(raw);
    inputId.value = raw; // reflect normalized
    if(!validateFormat(raw)){
      setResult(validateResult,'格式不正确，应为 AAABBBBBBBBBBBBC-DDD','err');
      return;
    }
    const res = computeExpectedChecksum(raw);
    if(!res){
      setResult(validateResult,'无法解析','err');
      return;
    }
    const {provided, expected} = res;
    if(provided === expected){
      setResult(validateResult,'校验成功 ✓ (校验位 '+provided+')','ok');
    } else {
      setResult(validateResult,'校验失败，期望校验位 '+ expected + '，但提供的是 ' + provided,'err');
    }
  });

  btnGenerate.addEventListener('click', () => {
    const id = generateId(genA.value.trim(), genB.value.trim());
    generateResult.textContent = id;
    generateResult.className = 'result ok';
    inputId.value = id; // 方便立即校验
  });

  function normalizeInput(id){
    // Pattern segments roughly: AAA + 10 + 1 + - + 3 (we won't recalc checksum here)
    const parts = id.split('-');
    if(parts.length !== 2) return id; // keep original for regex fail message
    let left = parts[0];
    if(left.length < 16) return id; // AAA + 12 + c = 16
    const AAA = left.slice(0,3).toUpperCase();
    const body = left.slice(3,15).toLowerCase(); // 12 chars
    const checksum = left.slice(15,16).toUpperCase();
    const tail = parts[1].toLowerCase();
    return AAA + body + checksum + '-' + tail;
  }

  function setResult(el,text,type){
    el.textContent = text;
    el.className = 'result ' + type;
  }
})();
