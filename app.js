'use strict';
const names = { clinic: 'Mapped clinic', dispensary: 'Mapped dispensary', cafe: 'Mapped café', other: 'Type unverified' };
const colors = { clinic: '#b39ddb', dispensary: '#b8d9c2', cafe: '#f9c1ce', other: '#b6bfc1' };
const list = document.querySelector('#places');
const count = document.querySelector('#count');
const search = document.querySelector('#search');
const filters = [...document.querySelectorAll('[data-kind]')];
const mapNote = document.querySelector('#map-note');
const fold = text => text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
const lessMotion = matchMedia('(prefers-reduced-motion: reduce)');
let all = [], shown = [], kind = 'all', map, pins, active, hasData = false;

function select(id, fromMap) {
  const row = shown.find(p => p[0] === id);
  if (!row) return;
  active?.removeAttribute('aria-current');
  active = document.getElementById(row[0]);
  active?.setAttribute('aria-current', 'true');
  if (map && pins) map.easeTo({center:[row[3],row[2]],zoom:Math.max(15,map.getZoom()),duration:lessMotion.matches?0:220});
  if (fromMap && active) active.focus();
  if (!fromMap && pins && matchMedia('(max-width: 44rem)').matches) {
    document.querySelector('.scene').scrollIntoView({block:'start'});
  }
  if (!fromMap && !pins) {
    mapNote.hidden = false;
    mapNote.textContent = 'Map unavailable. Use the source link for this place.';
  }
}

function mapUnavailable() {
  const scene = document.querySelector('.scene');
  scene.classList.add('unavailable');
  document.querySelector('#map').hidden = true;
  mapNote.hidden = false;
  mapNote.textContent = 'Map unavailable. You can still search the directory.';
}

function drawPins() {
  if (!pins) return;
  pins.setData({type:'FeatureCollection',features:shown.map(([id,name,lat,lng,kind])=>({
    type:'Feature',geometry:{type:'Point',coordinates:[lng,lat]},properties:{id,name,kind}
  }))});
}

function render() {
  if (!hasData) return;
  const q = fold(search.value.trim());
  shown = all.filter(p => (kind === 'all' || p[4] === kind) && (fold(p[1]).includes(q) || fold(p[5]).includes(q)));
  count.textContent = shown.length ? `${shown.length} of ${all.length} mapped places` : 'No matches. Try a different name or category.';
  const rows = shown.map(([id, name, , , subtype]) => {
    const li = document.createElement('li'), button = document.createElement('button');
    const title = document.createElement('span'), meta = document.createElement('span');
    const dot = document.createElement('span'), source = document.createElement('a');
    button.type = 'button'; button.id = id; button.className = 'place';
    if (id === active?.id) button.setAttribute('aria-current','true');
    title.className = 'name'; title.textContent = name;
    if (/\p{Script=Thai}/u.test(name)) title.lang = 'th';
    meta.className = 'meta'; dot.className = 'dot'; dot.dataset.kind = subtype;
    dot.setAttribute('aria-hidden','true');
    meta.append(dot, names[subtype]);
    button.append(title,meta);
    button.addEventListener('click',()=>select(id,false));
    source.className = 'source';
    const osm = /^([nwr])(\d+)$/.exec(id);
    if (osm) {
      source.href = `https://www.openstreetmap.org/${{n:'node',w:'way',r:'relation'}[osm[1]]}/${osm[2]}`;
      source.textContent = 'OSM ↗';
      source.setAttribute('aria-label',`OpenStreetMap record for ${name}`);
    } else {
      source.href = 'https://docs.overturemaps.org/guides/places/';
      source.textContent = 'Overture ↗';
      source.setAttribute('aria-label',`Overture dataset for ${name}`);
    }
    li.append(button,source); return li;
  });
  list.replaceChildren(...rows);
  active = active ? document.getElementById(active.id) : null;
  drawPins();
}
search.addEventListener('input',render);
for (const button of filters) button.addEventListener('click',()=>{
  kind=button.dataset.kind;
  for (const other of filters) other.setAttribute('aria-pressed',String(other===button));
  render();
});
fetch('./places.json').then(r=>{
  if (!r.ok) throw new Error('Directory fetch failed');
  return r.json();
}).then(({places})=>{
  all = places.sort((a,b)=>a[1].localeCompare(b[1],['th','en']));
  hasData = true; render();
}).catch(()=>{
  count.textContent = 'Could not load the directory. Reload the page to try again.';
});

try {
  map = new maplibregl.Map({
    container:'map',style:'https://tiles.openfreemap.org/styles/positron',
    center:[100.54,13.75],zoom:11.15,dragRotate:false,pitchWithRotate:false,cooperativeGestures:true
  });
  map.addControl(new maplibregl.NavigationControl({showCompass:false}));
  const mapTimeout = setTimeout(mapUnavailable, 12000);
  map.once('load',()=>{
    clearTimeout(mapTimeout);
    document.querySelector('.scene').classList.remove('unavailable');
    document.querySelector('#map').hidden = false;
    map.resize();
    map.addSource('places',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    pins = map.getSource('places');
    map.addLayer({id:'places-dots',type:'circle',source:'places',paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],9,3,15,7],
      'circle-color':['match',['get','kind'],'clinic',colors.clinic,'dispensary',colors.dispensary,'cafe',colors.cafe,colors.other],
      'circle-stroke-width':1.25,'circle-stroke-color':'#7d133a'
    }});
    map.on('click','places-dots',e=>select(e.features[0].properties.id,true));
    map.on('mouseenter','places-dots',()=>{map.getCanvas().style.cursor='pointer'});
    map.on('mouseleave','places-dots',()=>{map.getCanvas().style.cursor=''});
    drawPins(); mapNote.hidden = true;
  });
} catch {
  mapUnavailable();
}
