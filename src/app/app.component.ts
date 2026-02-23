import { Component } from '@angular/core';
import { CommitChatComponent } from './features/commit-chat/commit-chat.component';

@Component({
  selector: 'app-root',
  imports: [ CommitChatComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'conventional-commit-chat';
}
