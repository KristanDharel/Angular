import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Admincomponent } from './admincomponent';

describe('Admincomponent', () => {
  let component: Admincomponent;
  let fixture: ComponentFixture<Admincomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admincomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Admincomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
