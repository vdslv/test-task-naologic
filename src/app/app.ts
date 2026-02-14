import { Component } from '@angular/core';
import { TimelineComponent } from './components/timeline/timeline.component';

@Component({
  selector: 'app-root',
  imports: [TimelineComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
