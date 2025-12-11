import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrl: './loading-indicator.component.scss'
})
export class LoadingIndicatorComponent {

  @Input() isLoading: boolean = false;
  @Input() message: string = 'Загрузка...';

}
