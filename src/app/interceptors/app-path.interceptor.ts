import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

  	if (req.urlstartsWith('/')) {
    	const apiReq = req.clone({ url: `app/${req.url}` });
    	return next.handle(apiReq);
    }

    return next.handle(req);
  }
}