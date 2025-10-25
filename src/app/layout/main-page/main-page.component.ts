import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Brigade} from "../../domain/brigade";
import {Product} from "../../domain/product";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent {

  brigades: Brigade[] = [{ name: '', peopleCount: null, load: null }];
  products: Product[] = [{
    name: '', serialPlan: null, nonSerialPlan: null, assemblyRate: null,
    productionRates: {}, qualifications: {}
  }];

  startDate = '';
  alpha = 1.0;
  result: any = null;
  error = '';

  constructor(private http: HttpClient, private translate: TranslateService) {
    translate.addLangs(['en', 'ru']);
    translate.setDefaultLang('ru');
  }

  // === Бригады ===
  addBrigade() {
    this.brigades.push({ name: '', peopleCount: null, load: null });
  }

  deleteBrigade(i: number) {
    this.brigades.splice(i, 1);
  }

  // === Изделия ===
  addProduct() {
    this.products.push({
      name: '', serialPlan: null, nonSerialPlan: null, assemblyRate: null,
      productionRates: {}, qualifications: {}
    });
  }

  deleteProduct(i: number) {
    this.products.splice(i, 1);
  }

  // === Расчёт ===
  calculate() {
    if (!this.startDate) {
      alert('Пожалуйста, выберите дату начала расчета');
      return;
    }

    this.http.post('http://localhost:5000/optimize', {
      brigades: this.brigades,
      products: this.products,
      startDate: this.startDate,
      alpha: this.alpha
    }).subscribe({
      next: (data) => {
        this.result = data;
        this.error = '';
      },
      error: (err) => {
        this.error = err?.error?.error || 'Произошла ошибка при расчете';
      }
    });
  }

}
