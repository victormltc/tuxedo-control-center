import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoCommownComponent } from './info-commown.component';

describe('InfoCommownComponent', () => {
  let component: InfoCommownComponent;
  let fixture: ComponentFixture<InfoCommownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoCommownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoCommownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
