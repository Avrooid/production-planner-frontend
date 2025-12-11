import { Component } from '@angular/core';
import {Alert} from "../../domain/alert";
import {AlertService} from "../../service/alert-service";
import {
  faCheckCircle,
  faComment,
  faExclamationTriangle,
  faInfoCircle,
  faTimesCircle, faXmark
} from "@fortawesome/free-solid-svg-icons";
import {Observable} from "rxjs";

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
export class AlertComponent {

  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.alerts$.subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  dismissAlert(alert: Alert): void {
    this.alertService.removeAlert(alert.id);
  }

  getAlertIcon(type: string): any {
    switch (type) {
      case 'success': return faCheckCircle;
      case 'error': return faTimesCircle;
      case 'warning': return faExclamationTriangle;
      case 'info': return faInfoCircle;
      default: return faComment;
    }
  }

  protected readonly faXmark = faXmark;
}
