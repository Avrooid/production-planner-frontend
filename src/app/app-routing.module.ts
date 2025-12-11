import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TeamsComponent} from "./layout/teams/teams.component";
import {EmployeesComponent} from "./layout/employees/employees.component";
import {ProductsComponent} from "./layout/products/products.component";
import {TeamProductivityComponent} from "./layout/team-productivity/team-productivity.component";
import {SessionsComponent} from "./layout/sessions/sessions.component";

const routes: Routes = [
  { path: 'teams', component: TeamsComponent },
  { path: 'employees', component: EmployeesComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'team-productivity', component: TeamProductivityComponent },
  { path: 'sessions', component: SessionsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
