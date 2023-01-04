import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportCommownComponent } from './support-commown.component';

describe('SupportCommownComponent', () => {
  let component: SupportCommownComponent;
  let fixture: ComponentFixture<SupportCommownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SupportCommownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportCommownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
