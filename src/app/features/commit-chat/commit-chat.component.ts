import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  buttons?: { 
    label: string, 
    value: string,
    description?: string 
  }[];
}

@Component({
  selector: 'app-commit-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './commit-chat.component.html',
  styleUrls: ['./commit-chat.component.scss']
})
export class CommitChatComponent implements AfterViewChecked {

  @ViewChild('chatWindow') private chatWindow!: ElementRef;

  messages: ChatMessage[] = [];
  input = '';
  step = 0;

  commit = {
    type: '',
    scope: '',
    breaking: false,
    description: '',
    body: '',
    issue: ''
  };

  commitTypes = [
  { type: 'feat', description: 'Nova funcionalidade adicionada ao sistema' },
  { type: 'fix', description: 'Correção de um bug ou problema existente' },
  { type: 'docs', description: 'Alterações apenas na documentação' },
  { type: 'style', description: 'Alterações visuais como formatação, espaçamento (sem alteração de lógica)' },
  { type: 'refactor', description: 'Reestruturação de código sem alteração de comportamento' },
  { type: 'test', description: 'Criação ou alteração de testes' },
  { type: 'chore', description: 'Tarefas de manutenção (dependências, settings, configs...)' }
];

  constructor() {
    this.ask();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatWindow.nativeElement.scrollTo({
        top: this.chatWindow.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    } catch {}
  }

  // Enviar resposta de input
  send() {
    if (!this.input.trim()) return;

    this.messages.push({ role: 'user', content: this.input });
    this.processAnswer(this.input.trim());
    this.input = '';
  }

  // Enviar resposta via botão
  select(value: string) {
    this.messages.push({ role: 'user', content: value });
    this.processAnswer(value);
  }

  processAnswer(answer: string) {

    switch (this.step) {
      case 0: this.commit.type = answer; break;
      case 1: if (answer !== '-') this.commit.scope = answer; break;
      case 2: this.commit.breaking = answer.toLowerCase() === 'sim'; break;
      case 3: this.commit.description = answer; break;
      case 4: if (answer !== '-') this.commit.body = answer; break;
      case 5:
        if (answer !== '-') {
          const valid = /^(\d+\s*,\s*)*\d+$/.test(answer);
          if (!valid) {
            this.messages.push({ role: 'assistant', content: '❌ Entrada inválida. Use apenas números de issues separados por vírgula, ex: 12,34,56' });
            return;
          }
          this.commit.issue = answer;
        }
        break;
    }

    this.step++;
    this.ask();
  }

  ask() {
    if (this.step === 0) {
  this.messages.push({
    role: 'assistant',
    content: '👋 Qual o tipo do commit?',
    buttons: this.commitTypes.map(t => ({
      label: t.type,
      value: t.type,
      description: t.description
    }))
  });
} else if (this.step === 1) {
      this.messages.push({
        role: 'assistant',
        content: 'Deseja adicionar escopo? (ex: auth, api) ou "-" para pular'
      });
    } else if (this.step === 2) {
      this.messages.push({
        role: 'assistant',
        content: 'É uma breaking change?',
        buttons: [{ label: 'Sim', value: 'sim' }, { label: 'Não', value: 'não' }]
      });
    } else if (this.step === 3) {
      this.messages.push({ role: 'assistant', content: 'Digite a descrição curta (máx 72 caracteres)' });
    } else if (this.step === 4) {
      this.messages.push({ role: 'assistant', content: 'Deseja adicionar descrição detalhada ou "-" para pular' });
    } else if (this.step === 5) {
      this.messages.push({ role: 'assistant', content: 'Existe issue associada? Digite números separados por vírgula ou "-" se não houver' });
    } else {
      const result = this.generateCommit();
      this.messages.push({ role: 'assistant', content: '✅ Commit gerado:' });
      this.messages.push({ role: 'assistant', content: '``` \n' + result + '\n```' });
    }
  }

  generateCommit(): string {
  let header = this.commit.type;

  if (this.commit.scope) {
    header += `(${this.commit.scope})`;
  }

  if (this.commit.breaking) {
    header += '!';
  }

  header += `: ${this.commit.description}`;

  const hasBody = !!this.commit.body;
  const hasFooter = !!this.commit.issue;

  let result = header;

  // BODY (sem linha extra antes)
  if (hasBody) {
    result += `\n${this.commit.body}`;
  }

  // FOOTER
  if (hasFooter) {
    const formattedIssues = this.commit.issue
      .split(',')
      .map(i => `${i.trim()}`)
      .join(', ');

    // 🔥 Se NÃO houver body, precisa de linha em branco antes do footer
    if (!hasBody) {
      result += `\n`;
    }

    result += `\nRefs: ${formattedIssues}`;
  }

  return result.toLowerCase();
}

  reset() {
    this.messages = [];
    this.step = 0;
    this.commit = { type: '', scope: '', breaking: false, description: '', body: '', issue: '' };
    this.ask();
  }

  copyCommit() {
    const lastCommitMsg = this.messages
      .filter(m => m.role === 'assistant' && m.content.startsWith('```'))
      .pop();

    if (lastCommitMsg) {
      const commitText = lastCommitMsg.content.replace(/```/g, '').trim();
      navigator.clipboard.writeText(commitText);
      this.messages.push({ role: 'assistant', content: '✔ Commit copiado para a área de transferência!' });
    }
  }
  hasGeneratedCommit(): boolean {
  return this.messages.some(
    m => m.role === 'assistant' && m.content.startsWith('```')
  );
}
}