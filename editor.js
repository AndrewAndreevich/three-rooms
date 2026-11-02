// Camera editor (?edit): fly through a room and set where the walk back starts and ends.
//   drag: look around · W A S D: move · Q / E: down / up · Shift: faster · wheel: lens
//   Set start: the pose at the window (position and the way it looks)
//   Set end: the point by the wall behind (the camera keeps looking the same way)
//   Play: walks start → end; Save writes every room to assets/rooms/rooms.json through tools/editor.py.
import * as THREE from 'three';

export default function ({ ROOMS, meshes, camera, canvas, show, poseOf, loading }) {
  const r1 = x => Math.round(x * 10) / 10, r3 = x => Math.round(x * 1000) / 1000;
  let k = 0, play = -1;
  const pos = new THREE.Vector3(), rot = { yaw: 0, pitch: 0 };
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;right:16px;top:60px;z-index:50;width:270px;padding:14px;background:rgba(10,10,10,.85);' +
    'color:#fff;font:12px/1.5 system-ui,sans-serif;border-radius:10px;backdrop-filter:blur(6px)';
  const btn = (key, label) => `<button data-b="${key}" style="margin:6px 4px 0 0;padding:5px 9px;border:0;border-radius:6px;background:#333;color:#fff;cursor:pointer">${label}</button>`;
  panel.innerHTML = `<div data-rooms></div><div data-pose style="margin-top:8px;opacity:.75"></div>
    <label style="display:block;margin-top:6px">Lens, ° <b data-fovv></b><input data-fov type="range" min="30" max="110" step="1" style="width:100%"></label>
    <label style="display:block;margin-top:4px"><input data-flip type="checkbox"> Flip upside down</label>
    <div>${btn('start', 'Set start')}${btn('end', 'Set end')}${btn('gostart', 'Go to start')}${btn('goend', 'Go to end')}${btn('play', 'Play')}${btn('save', 'Save')}</div>
    <div data-msg style="margin-top:8px;opacity:.8">Drag: look · WASD: move · Q/E: down/up · Shift: faster</div>`;
  document.body.append(panel);
  const $e = q => panel.querySelector(q);
  const msg = t => { $e('[data-msg]').textContent = t; };
  $e('[data-rooms]').innerHTML = ROOMS.map((r, i) =>
    `<button data-room="${i}" style="margin:0 4px 4px 0;padding:3px 7px;border:0;border-radius:5px;background:#333;color:#fff;cursor:pointer;font-size:11px">${i + 1}. ${r.title}</button>`).join('');
  function goStart() { const r = ROOMS[k]; pos.fromArray(r.start.p); rot.yaw = r.start.yaw; rot.pitch = r.start.pitch; }
  function sync() {
    const r = ROOMS[k];
    panel.querySelectorAll('[data-room]').forEach(b => b.style.background = +b.dataset.room === k ? '#c8921a' : '#333');
    $e('[data-fov]').value = r.fov; $e('[data-fovv]').textContent = r.fov;
    $e('[data-flip]').checked = !!r.flip;
  }
  function room(i) { k = i; goStart(); sync(); if (!meshes[k]) msg('Loading this room…'); }
  room(0);
  panel.addEventListener('input', e => {
    if (e.target.dataset.fov !== undefined) ROOMS[k].fov = +e.target.value;
    if (e.target.dataset.flip !== undefined) ROOMS[k].flip = e.target.checked;
    sync();
  });
  panel.addEventListener('click', async e => {
    if (e.target.dataset.room) return room(+e.target.dataset.room);
    const b = e.target.dataset.b, r = ROOMS[k];
    if (b === 'start') { r.start = { p: pos.toArray().map(r3), yaw: r1(rot.yaw), pitch: r1(rot.pitch) }; msg('Start set'); }
    if (b === 'end') { r.end = pos.toArray().map(r3); msg('End set'); }
    if (b === 'gostart') goStart();
    if (b === 'goend') { pos.fromArray(r.end); rot.yaw = r.start.yaw; rot.pitch = r.start.pitch; }
    if (b === 'play') play = 0;
    if (b === 'save') {
      const body = JSON.stringify(ROOMS, null, 2);
      const ok = await fetch('save-rooms', { method: 'POST', body }).then(r => r.ok).catch(() => false);
      if (ok) msg('Saved to assets/rooms/rooms.json');
      else {
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([body])), download: 'rooms.json' });
        a.click(); msg('No editor server: downloaded rooms.json — put it in assets/rooms/');
      }
    }
  });
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); play = -1; });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    rot.yaw += (e.clientX - drag.x) * .15; rot.pitch = THREE.MathUtils.clamp(rot.pitch + (e.clientY - drag.y) * .15, -89, 89);
    drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  addEventListener('wheel', e => {
    if (panel.contains(e.target)) return;
    ROOMS[k].fov = THREE.MathUtils.clamp(ROOMS[k].fov + Math.sign(e.deltaY) * 2, 30, 110); sync();
  });
  const keys = new Set();
  addEventListener('keydown', e => { keys.add(e.code); if (e.shiftKey) keys.add('Shift'); });
  addEventListener('keyup', e => { keys.delete(e.code); if (!e.shiftKey) keys.delete('Shift'); });
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), pose = new THREE.Matrix4(), q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ');
  const D2R = THREE.MathUtils.degToRad;
  loading.then(() => msg('All rooms loaded'));
  window.roomsEditor = { pos, rot, room, meshes };   // for poking at from the console
  return {
    frame(dt, fovFor) {
      const r = ROOMS[k];
      const speed = (keys.has('Shift') ? 3 : .8) * dt;
      E.set(D2R(rot.pitch), D2R(rot.yaw), 0); q.setFromEuler(E);
      fwd.set(0, 0, -1).applyQuaternion(q); right.set(1, 0, 0).applyQuaternion(q);
      if (keys.has('KeyW')) pos.addScaledVector(fwd, speed);
      if (keys.has('KeyS')) pos.addScaledVector(fwd, -speed);
      if (keys.has('KeyD')) pos.addScaledVector(right, speed);
      if (keys.has('KeyA')) pos.addScaledVector(right, -speed);
      if (keys.has('KeyE')) pos.y += speed;
      if (keys.has('KeyQ')) pos.y -= speed;
      meshes.forEach(m => m && (m.visible = false));
      if (play >= 0) {
        play += dt / 4;
        poseOf(r, play, undefined, pose);
        pose.decompose(pos, q, new THREE.Vector3());
        rot.yaw = r.start.yaw; rot.pitch = r.start.pitch;
        if (play >= 1) play = -1;
      }
      pose.compose(pos, q.setFromEuler(E.set(D2R(rot.pitch), D2R(rot.yaw), 0)), new THREE.Vector3(1, 1, 1));
      show(k, pose, 1);
      camera.fov = fovFor(r); camera.updateProjectionMatrix();
      $e('[data-pose]').textContent = `pos ${pos.toArray().map(r3).join(', ')} · turn ${r1(rot.yaw)}° · tilt ${r1(rot.pitch)}°`;
    },
  };
}
