import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface Destino { id: string; name: string; section: string; price: number; isActive: boolean; }

const SECCIONES = ['Perímetro Centro','Zona Central y Alrededores','Perímetro Indio-Pampa','Intermunicipal','Rural','Fuera de Perímetro'];

@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-container">
      <div>
        <h1 class="page-title">TABLA DE <span>DESTINOS</span></h1>
        <div class="cyan-divider"></div>
        <p class="sub">Precios por destino que se muestran en la app. Puedes editar, agregar o eliminar cualquier destino.</p>
      </div>

      @if (successMsg()) { <div class="alert-success">{{ successMsg() }}</div> }
      @if (errorMsg())   { <div class="alert-error">{{ errorMsg() }}</div> }

      <!-- Add form -->
      <div class="add-card">
        <h3 class="add-title">Agregar destino</h3>
        <div class="add-row">
          <input class="mv-input" [(ngModel)]="newName" placeholder="Nombre del destino" />
          <select class="mv-input" [(ngModel)]="newSection">
            @for (s of secciones; track s) { <option [value]="s">{{ s }}</option> }
          </select>
          <div class="price-wrap">
            <span class="prefix">$</span>
            <input class="mv-input" type="number" [(ngModel)]="newPrice" placeholder="Precio" min="0" />
          </div>
          <button class="btn-add" (click)="addDestino()" [disabled]="adding()">
            {{ adding() ? 'Guardando…' : '+ Agregar' }}
          </button>
        </div>
      </div>

      <!-- Filter + search -->
      <div class="toolbar">
        <input class="mv-input search" [(ngModel)]="searchQ" placeholder="Buscar destino…" />
        <select class="mv-input" [(ngModel)]="filterSection">
          <option value="">Todas las secciones</option>
          @for (s of secciones; track s) { <option [value]="s">{{ s }}</option> }
        </select>
        <span class="count">{{ filtered().length }} destinos</span>
      </div>

      @if (loading()) {
        <div class="mv-spinner"><div class="spinner"></div></div>
      } @else {
        <div class="mv-card" style="padding:0;overflow:hidden">
          <table class="mv-table">
            <thead>
              <tr><th>Destino</th><th>Sección</th><th>Precio</th><th></th></tr>
            </thead>
            <tbody>
              @for (d of filtered(); track d.id) {
                <tr>
                  <td>
                    @if (editId() === d.id) {
                      <input class="mv-input inline" [(ngModel)]="editName" />
                    } @else {
                      {{ d.name }}
                    }
                  </td>
                  <td>
                    @if (editId() === d.id) {
                      <select class="mv-input inline" [(ngModel)]="editSection">
                        @for (s of secciones; track s) { <option [value]="s">{{ s }}</option> }
                      </select>
                    } @else {
                      <span class="badge">{{ d.section }}</span>
                    }
                  </td>
                  <td>
                    @if (editId() === d.id) {
                      <div class="price-wrap">
                        <span class="prefix">$</span>
                        <input class="mv-input inline" type="number" [(ngModel)]="editPrice" />
                      </div>
                    } @else {
                      <span class="price">{{ fmt(d.price) }}</span>
                    }
                  </td>
                  <td class="actions">
                    @if (editId() === d.id) {
                      <button class="btn-save-sm" (click)="saveEdit(d.id)">Guardar</button>
                      <button class="btn-cancel-sm" (click)="editId.set(null)">Cancelar</button>
                    } @else {
                      <button class="btn-edit-sm" (click)="startEdit(d)">Editar</button>
                      <button class="btn-del-sm" (click)="deleteDestino(d.id)">Eliminar</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .sub { color:#666; font-size:13px; margin-top:8px; margin-bottom:24px; }

    .add-card { background:#161616; border:1px solid #252525; border-radius:12px; padding:20px; margin-bottom:20px; }
    .add-title { font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
    .add-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    .add-row .mv-input { flex:1; min-width:140px; }

    .toolbar { display:flex; gap:10px; align-items:center; margin-bottom:14px; flex-wrap:wrap; }
    .toolbar .mv-input { flex:1; min-width:160px; }
    .toolbar .search { max-width:260px; }
    .count { font-size:12px; color:#555; white-space:nowrap; }

    .price-wrap { display:flex; align-items:center; gap:0; border:1px solid #2a2a2a; border-radius:8px; overflow:hidden; flex:1; min-width:120px; }
    .prefix { padding:0 10px; background:#111; color:#555; font-size:14px; height:38px; display:flex; align-items:center; border-right:1px solid #2a2a2a; }
    .price-wrap .mv-input { border:none; border-radius:0; flex:1; }

    .badge { background:rgba(0,212,232,.08); border:1px solid rgba(0,212,232,.2); color:#00d4e8; border-radius:20px; padding:2px 10px; font-size:11px; white-space:nowrap; }
    .price { font-family:'Rajdhani',sans-serif; font-size:15px; font-weight:700; color:#00d4e8; }

    .actions { display:flex; gap:6px; white-space:nowrap; }
    .inline { padding:4px 8px; height:32px; font-size:13px; }

    .btn-add { padding:0 18px; height:38px; background:rgba(0,212,232,.1); border:1px solid rgba(0,212,232,.3); color:#00d4e8; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; &:hover:not(:disabled){ background:rgba(0,212,232,.2); } &:disabled{opacity:.5;cursor:default;} }
    .btn-edit-sm  { padding:4px 10px; background:rgba(0,212,232,.08); border:1px solid rgba(0,212,232,.2); color:#00d4e8; border-radius:6px; font-size:12px; cursor:pointer; }
    .btn-save-sm  { padding:4px 10px; background:rgba(0,230,118,.08); border:1px solid rgba(0,230,118,.2); color:#00e676; border-radius:6px; font-size:12px; cursor:pointer; }
    .btn-cancel-sm{ padding:4px 10px; background:transparent; border:1px solid #333; color:#666; border-radius:6px; font-size:12px; cursor:pointer; }
    .btn-del-sm   { padding:4px 10px; background:rgba(255,68,68,.08); border:1px solid rgba(255,68,68,.2); color:#ff4444; border-radius:6px; font-size:12px; cursor:pointer; }

    .alert-success { padding:12px 16px; border-radius:8px; margin-bottom:16px; background:rgba(0,230,118,.1); border:1px solid rgba(0,230,118,.3); color:#00e676; font-size:13px; }
    .alert-error   { padding:12px 16px; border-radius:8px; margin-bottom:16px; background:rgba(255,68,68,.1); border:1px solid rgba(255,68,68,.3); color:#ff4444; font-size:13px; }
  `],
})
export class PreciosAdminComponent implements OnInit {
  private api = inject(ApiService);
  secciones = SECCIONES;

  loading = signal(true);
  adding = signal(false);
  successMsg = signal<string|null>(null);
  errorMsg = signal<string|null>(null);

  destinos = signal<Destino[]>([]);
  searchQ = '';
  filterSection = '';

  newName = '';
  newSection = SECCIONES[0];
  newPrice = 0;

  editId = signal<string|null>(null);
  editName = '';
  editSection = '';
  editPrice = 0;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getPriceDestinations().subscribe({
      next: d => { this.destinos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  get filtered() {
    return () => this.destinos().filter(d => {
      const q = this.searchQ.toLowerCase();
      const matchQ = !q || d.name.toLowerCase().includes(q);
      const matchS = !this.filterSection || d.section === this.filterSection;
      return matchQ && matchS;
    });
  }

  addDestino() {
    if (!this.newName.trim() || this.newPrice <= 0) return;
    this.adding.set(true);
    this.api.createPriceDestination({ name: this.newName.trim(), section: this.newSection, price: this.newPrice }).subscribe({
      next: d => {
        this.destinos.update(arr => [...arr, d]);
        this.newName = ''; this.newPrice = 0;
        this.adding.set(false);
        this.flash('success', 'Destino agregado.');
      },
      error: () => { this.adding.set(false); this.flash('error', 'Error al agregar.'); },
    });
  }

  startEdit(d: Destino) {
    this.editId.set(d.id);
    this.editName = d.name;
    this.editSection = d.section;
    this.editPrice = d.price;
  }

  saveEdit(id: string) {
    this.api.updatePriceDestination(id, { name: this.editName, section: this.editSection, price: this.editPrice }).subscribe({
      next: updated => {
        this.destinos.update(arr => arr.map(d => d.id === id ? { ...d, ...updated } : d));
        this.editId.set(null);
        this.flash('success', 'Destino actualizado.');
      },
      error: () => this.flash('error', 'Error al guardar.'),
    });
  }

  deleteDestino(id: string) {
    if (!confirm('¿Eliminar este destino?')) return;
    this.api.deletePriceDestination(id).subscribe({
      next: () => {
        this.destinos.update(arr => arr.filter(d => d.id !== id));
        this.flash('success', 'Destino eliminado.');
      },
      error: () => this.flash('error', 'Error al eliminar.'),
    });
  }

  fmt(v: number) { return '$' + new Intl.NumberFormat('es-CO').format(v); }

  private flash(type: 'success'|'error', msg: string) {
    if (type === 'success') { this.successMsg.set(msg); setTimeout(() => this.successMsg.set(null), 3000); }
    else { this.errorMsg.set(msg); setTimeout(() => this.errorMsg.set(null), 4000); }
  }
}
