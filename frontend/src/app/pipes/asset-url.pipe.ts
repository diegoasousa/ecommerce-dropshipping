import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({
  name: 'assetUrl',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class AssetUrlPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    return `${environment.apiBaseUrl}${value}`;
  }
}