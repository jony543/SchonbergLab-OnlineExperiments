import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';


import { AuthService } from '@app/shared/services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth.component.scss'],
})
export class LoginComponent {
  email: string | null = null;
  password: string | null = null;

  constructor(private router: Router, private authService: AuthService, private route: ActivatedRoute) {}

  login(): void {
    this.authService.login(this.email!, this.password!).subscribe(() => {
      let redirect = this.route?.snapshot?.queryParams?.redirect;
      if (redirect) {
        window.location.href = redirect;        
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }
}
