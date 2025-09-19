import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isArrayAndLength',
  standalone: true,
})
export class IsArrayAndLengthPipe implements PipeTransform {
  transform(value: unknown, minLength: number = 1): boolean {
    return Array.isArray(value) && value.length > minLength;
  }
}