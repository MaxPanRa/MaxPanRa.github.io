import { Component } from '@angular/core';
import { ProductWrapperComponent } from './product-wrapper/product-wrapper';

@Component({
  selector: 'app-root',
  imports: [ProductWrapperComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
}
