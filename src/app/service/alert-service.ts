import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {Alert} from "../domain/alert";

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$: Observable<Alert[]> = this.alertsSubject.asObservable();
  private nextId = 0;

  /**
   * Показать уведомление об успехе
   */
  success(message: string, duration: number = 5000): void {
    this.showAlert({
      id: this.nextId++,
      type: 'success',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Показать уведомление об ошибке
   */
  error(message: string, duration: number = 7000): void {
    this.showAlert({
      id: this.nextId++,
      type: 'error',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Показать предупреждение
   */
  warning(message: string, duration: number = 6000): void {
    this.showAlert({
      id: this.nextId++,
      type: 'warning',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Показать информационное сообщение
   */
  info(message: string, duration: number = 4000): void {
    this.showAlert({
      id: this.nextId++,
      type: 'info',
      message,
      duration,
      dismissible: true
    });
  }

  /**
   * Показать кастомное уведомление
   */
  showAlert(alert: Alert): void {
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([...currentAlerts, alert]);

    // Автоматическое удаление через указанное время
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        this.removeAlert(alert.id);
      }, alert.duration);
    }
  }

  /**
   * Удалить уведомление по ID
   */
  removeAlert(id: number): void {
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next(currentAlerts.filter(alert => alert.id !== id));
  }

  /**
   * Очистить все уведомления
   */
  clear(): void {
    this.alertsSubject.next([]);
  }
}
