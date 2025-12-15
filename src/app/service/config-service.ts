import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  get serverAddress(): string {
    return window.__env?.SERVER_ADDRESS || '';
  }
}
