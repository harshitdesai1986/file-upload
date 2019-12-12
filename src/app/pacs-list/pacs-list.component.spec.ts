import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PacsListComponent } from './pacs-list.component';

describe('PacsListComponent', () => {
  let component: PacsListComponent;
  let fixture: ComponentFixture<PacsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PacsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PacsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
