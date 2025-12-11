import { Component } from '@angular/core';
import {faBusinessTime, faClock, faIndustry, faUsers, faUserTie} from "@fortawesome/free-solid-svg-icons";


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  pages = [
    {title: "Бригады", route: "/teams", icon: faUsers},
    {title: "Изделия", route: "/products", icon: faIndustry},
    {title: "Сотрудники", route: "/employees", icon: faUserTie},
    {title: "Производительность бригад", route: "/team-productivity", icon: faBusinessTime},
    {title: "Сессии", route: "/sessions", icon: faClock}
  ]

  constructor() {}

}
