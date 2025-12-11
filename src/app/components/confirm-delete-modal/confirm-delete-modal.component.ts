import {Component, EventEmitter, Input, Output} from '@angular/core';
import {faXmark} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-confirm-delete-modal',
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.scss'
})
export class ConfirmDeleteModalComponent {

  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() itemName: string = '';
  @Input() confirmButtonText: string = '';
  @Input() cancelButtonText: string = '';

  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  protected readonly faXmark = faXmark;

  onConfirm(): void {
    this.confirm.emit();
  }

  onClose(): void {
    this.close.emit();
  }

}
