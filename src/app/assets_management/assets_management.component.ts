import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-assets-management',  
  styleUrls: ['./assets_management.component.scss'],
  template: `
  <iframe #iframe id="iframe" src='study_assets'></iframe>
  `
})
export class AssetsManagementComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
