import L from 'leaflet';

export function mandiPinIcon(active: boolean): L.DivIcon {
  const color = active ? '#10b981' : '#4f46e5';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;transform:translate(-50%,-100%);">
        <div style="width:28px;height:28px;background:${color};border:2.5px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;">
          <div style="width:9px;height:9px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div>
        </div>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export function referenceIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:30px;height:30px;transform:translate(-50%,-100%);">
        <div style="width:30px;height:30px;background:#0f172a;border:3px solid #ffffff;border-radius:50%;box-shadow:0 3px 8px rgba(15,23,42,0.4);display:flex;align-items:center;justify-content:center;">
          <div style="width:11px;height:11px;border-radius:2px;background:#ffffff;position:relative;">
            <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:12px;line-height:1;color:#0f172a;font-weight:800;">H</span>
          </div>
        </div>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}