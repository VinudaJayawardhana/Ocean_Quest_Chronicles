/**
 * Ocean Quest Chronicles — CIS045-3 Distributed Service Architectures * Core application architecture and component implementation.
 */
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
