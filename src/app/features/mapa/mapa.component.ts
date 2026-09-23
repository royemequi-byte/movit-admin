import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, signal } from '@angular/core';
import { ApiService, LiveDriver, LiveTrip } from '../../core/services/api.service';

declare const L: any;

const FUSA_CENTER: [number, number] = [4.3372, -74.3644];

@Component({
  selector: 'app-mapa',
  standalone: true,
  template: `
    <div class="page">
      <div class="topbar">
        <div>
          <h1>Mapa en tiempo real</h1>
          <p class="sub">Conductoras disponibles e inactivas · Viajes activos</p>
        </div>
        <div class="controls">
          <div class="legend">
            <span class="dot green"></span> Disponible ({{ availableCount() }})
            <span class="dot gray" style="margin-left:12px"></span> No disponible ({{ unavailableCount() }})
            <span class="dot orange" style="margin-left:12px"></span> Viaje activo ({{ tripCount() }})
          </div>
          <button class="btn-refresh" [disabled]="loading()" (click)="reload()">
            {{ loading() ? '…' : '↻ Actualizar' }}
          </button>
        </div>
      </div>

      <div class="map-wrap">
        <div #mapEl class="map"></div>
      </div>

      <p class="hint">Auto-actualización cada 30 s · Fusagasugá, Cundinamarca</p>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; height: 100vh; padding: 24px 28px 0; box-sizing: border-box; }
    .topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; flex-shrink: 0; }
    h1 { font-family: 'Rajdhani', sans-serif; font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 4px; }
    .sub { color: #666; font-size: 13px; margin: 0; }
    .controls { display: flex; align-items: center; gap: 20px; }
    .legend { font-size: 13px; color: #888; display: flex; align-items: center; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; }
    .dot.green { background: #00e676; }
    .dot.gray { background: #555; }
    .dot.orange { background: #ffab00; }
    .btn-refresh {
      background: #161616; border: 1px solid #333; border-radius: 8px;
      color: #ccc; font-size: 13px; padding: 8px 16px; cursor: pointer;
      transition: border-color .2s;
      &:hover:not(:disabled) { border-color: #00d4e8; color: #00d4e8; }
      &:disabled { opacity: .5; }
    }
    .map-wrap { flex: 1; border-radius: 12px; overflow: hidden; border: 1px solid #252525; }
    .map { width: 100%; height: 100%; }
    .hint { flex-shrink: 0; color: #444; font-size: 12px; text-align: center; padding: 10px 0; margin: 0; }
  `],
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private api = inject(ApiService);
  private map: any = null;
  private markers: any[] = [];
  private interval: any;

  loading = signal(false);
  availableCount = signal(0);
  unavailableCount = signal(0);
  tripCount = signal(0);

  ngOnInit() {
    this.loadLeaflet();
  }

  ngAfterViewInit() {
    if (typeof L !== 'undefined') this.initMap();
  }

  ngOnDestroy() {
    clearInterval(this.interval);
    this.map?.remove();
  }

  private loadLeaflet() {
    if (typeof L !== 'undefined') { this.initMap(); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (this.mapEl) this.initMap();
    };
    document.head.appendChild(script);
  }

  private initMap() {
    if (this.map) return;
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true }).setView(FUSA_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.map);

    this.reload();
    this.interval = setInterval(() => this.reload(), 30_000);
  }

  reload() {
    if (!this.map) return;
    this.loading.set(true);
    this.api.getLiveMap().subscribe({
      next: ({ drivers, trips }) => {
        this.clearMarkers();
        this.paintDrivers(drivers);
        this.paintTrips(trips);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private clearMarkers() {
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  private paintDrivers(drivers: LiveDriver[]) {
    let av = 0, unav = 0;
    for (const d of drivers) {
      const color = d.isAvailable ? '#00e676' : '#555555';
      const circle = L.circleMarker([d.currentLat, d.currentLng], {
        radius: 9, fillColor: color, color: '#0d0d0d',
        weight: 2, fillOpacity: 0.9,
      });
      circle.bindPopup(`
        <b>${d.user.firstName} ${d.user.lastName}</b><br>
        ${d.user.phone}<br>
        <span style="color:${color}">${d.isAvailable ? '● Disponible' : '● No disponible'}</span>
      `);
      circle.addTo(this.map);
      this.markers.push(circle);
      d.isAvailable ? av++ : unav++;
    }
    this.availableCount.set(av);
    this.unavailableCount.set(unav);
  }

  private paintTrips(trips: LiveTrip[]) {
    this.tripCount.set(trips.length);
    for (const t of trips) {
      const origin = L.circleMarker([t.originLat, t.originLng], {
        radius: 7, fillColor: '#ffab00', color: '#0d0d0d', weight: 2, fillOpacity: 1,
      });
      origin.bindPopup(`
        <b>Origen</b><br>${t.originAddress}<br>
        Pasajera: ${t.passenger.firstName} ${t.passenger.lastName}<br>
        Estado: <b>${t.status}</b>
      `);
      origin.addTo(this.map);
      this.markers.push(origin);

      if (t.destLat && t.destLng) {
        const dest = L.circleMarker([t.destLat, t.destLng], {
          radius: 6, fillColor: '#ff4444', color: '#0d0d0d', weight: 2, fillOpacity: 0.8,
        });
        dest.bindPopup(`<b>Destino</b><br>${t.destAddress}`);
        dest.addTo(this.map);
        this.markers.push(dest);

        const line = L.polyline([[t.originLat, t.originLng], [t.destLat, t.destLng]], {
          color: '#ffab00', weight: 2, opacity: 0.5, dashArray: '6 4',
        });
        line.addTo(this.map);
        this.markers.push(line);
      }
    }
  }
}
