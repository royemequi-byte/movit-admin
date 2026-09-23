import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, Rating } from '../../core/services/api.service';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Calificaciones</h1>
          <p class="sub">{{ total() }} calificaciones en total</p>
        </div>
        <div class="avg-box" [class.good]="globalAvg() >= 4" [class.warn]="globalAvg() > 0 && globalAvg() < 4">
          <span class="stars">{{ starsStr(globalAvg()) }}</span>
          <span class="avg-val">{{ globalAvg().toFixed(1) }}</span>
          <span class="avg-label">promedio global</span>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Cargando calificaciones…</div>
      } @else if (ratings().length === 0) {
        <div class="empty">Aún no hay calificaciones registradas.</div>
      } @else {
        <div class="list">
          @for (r of ratings(); track r.id) {
            <div class="card">
              <div class="card-top">
                <div class="names">
                  <span class="rater">{{ r.rater.firstName }} {{ r.rater.lastName }}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span class="rated">{{ r.rated.firstName }} {{ r.rated.lastName }}</span>
                </div>
                <div class="score-row">
                  <span class="stars">{{ starsStr(r.score) }}</span>
                  <span class="score" [class.good]="r.score >= 4" [class.bad]="r.score <= 2">{{ r.score }}/5</span>
                </div>
              </div>
              @if (r.comment) {
                <p class="comment">"{{ r.comment }}"</p>
              }
              <div class="card-footer">
                <span class="route">{{ r.trip.originAddress }} → {{ r.trip.destAddress }}</span>
                <span class="date">{{ r.createdAt | date:'d MMM yyyy · HH:mm' }}</span>
              </div>
            </div>
          }
        </div>

        @if (total() > pageSize) {
          <div class="pagination">
            <button [disabled]="page() === 1" (click)="goPage(page() - 1)">← Anterior</button>
            <span>Página {{ page() }} de {{ totalPages() }}</span>
            <button [disabled]="page() === totalPages()" (click)="goPage(page() + 1)">Siguiente →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 32px; max-width: 860px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
    h1 { font-family: 'Rajdhani', sans-serif; font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 4px; }
    .sub { color: #666; font-size: 13px; margin: 0; }

    .avg-box {
      background: #161616; border: 1px solid #252525;
      border-radius: 12px; padding: 14px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      min-width: 110px;
      &.good { border-color: rgba(0,230,118,.2); }
      &.warn { border-color: rgba(255,171,0,.2); }
    }
    .avg-val { font-size: 28px; font-weight: 700; color: #fff; font-family: 'Rajdhani', sans-serif; }
    .avg-label { font-size: 11px; color: #555; }

    .loading, .empty { color: #666; padding: 40px 0; text-align: center; }

    .list { display: flex; flex-direction: column; gap: 12px; }

    .card {
      background: #161616; border: 1px solid #252525;
      border-radius: 12px; padding: 18px 20px;
      transition: border-color .2s;
      &:hover { border-color: #333; }
    }
    .card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .names { display: flex; align-items: center; gap: 8px; }
    .rater { color: #fff; font-weight: 600; font-size: 14px; }
    .rated { color: #888; font-size: 14px; }
    .score-row { display: flex; align-items: center; gap: 8px; }
    .stars { font-size: 15px; letter-spacing: 1px; color: #ffab00; }
    .score { font-weight: 700; font-size: 14px; color: #888; }
    .score.good { color: #00e676; }
    .score.bad { color: #ff4444; }

    .comment {
      color: #ccc; font-size: 14px; font-style: italic;
      line-height: 1.5; margin: 0 0 12px;
      padding: 10px 14px; background: #0d0d0d;
      border-radius: 8px; border-left: 3px solid #cea2fd;
    }

    .card-footer { display: flex; justify-content: space-between; align-items: center; }
    .route { color: #555; font-size: 12px; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date { color: #444; font-size: 12px; }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 20px;
      margin-top: 28px; color: #666; font-size: 14px;
      button {
        background: #161616; border: 1px solid #252525; border-radius: 8px;
        color: #888; padding: 8px 18px; cursor: pointer; font-size: 13px;
        transition: border-color .2s;
        &:hover:not(:disabled) { border-color: #00d4e8; color: #00d4e8; }
        &:disabled { opacity: .4; cursor: not-allowed; }
      }
    }
  `],
})
export class CalificacionesComponent implements OnInit {
  private api = inject(ApiService);

  loading = signal(true);
  ratings = signal<Rating[]>([]);
  total = signal(0);
  page = signal(1);
  readonly pageSize = 20;

  globalAvg = signal(0);

  totalPages() { return Math.max(1, Math.ceil(this.total() / this.pageSize)); }

  starsStr(score: number) {
    const s = Math.round(score);
    return '★'.repeat(s) + '☆'.repeat(Math.max(0, 5 - s));
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getRatings(this.page(), this.pageSize).subscribe({
      next: (res) => {
        this.ratings.set(res.ratings);
        this.total.set(res.total);
        if (res.ratings.length > 0) {
          const avg = res.ratings.reduce((sum, r) => sum + r.score, 0) / res.ratings.length;
          this.globalAvg.set(avg);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goPage(p: number) { this.page.set(p); this.load(); }
}
