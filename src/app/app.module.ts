import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainPageComponent } from './layout/main-page/main-page.component';
import {FormsModule} from "@angular/forms";
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader} from "@ngx-translate/http-loader";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import { TeamsComponent } from './layout/teams/teams.component';
import { EmployeesComponent } from './layout/employees/employees.component';
import { ProductsComponent } from './layout/products/products.component';
import { AlertComponent } from './components/alert/alert.component';
import { ConfirmDeleteModalComponent } from './components/confirm-delete-modal/confirm-delete-modal.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { TeamProductivityComponent } from './layout/team-productivity/team-productivity.component';
import { SessionsComponent } from './layout/sessions/sessions.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatNativeDateModule} from "@angular/material/core";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatSelectModule} from "@angular/material/select";
import {MatCheckboxModule} from "@angular/material/checkbox";

export function HttpLoaderFactory() {
  return new TranslateHttpLoader(); // без аргументов
}

@NgModule({
  declarations: [
    AppComponent,
    MainPageComponent,
    HeaderComponent,
    FooterComponent,
    TeamsComponent,
    EmployeesComponent,
    ProductsComponent,
    AlertComponent,
    ConfirmDeleteModalComponent,
    LoadingIndicatorComponent,
    TeamProductivityComponent,
    SessionsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    FontAwesomeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory
      }
    })
  ],
  providers: [
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: { prefix: './assets/i18n/', suffix: '.json' } // конфиг через DI
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
