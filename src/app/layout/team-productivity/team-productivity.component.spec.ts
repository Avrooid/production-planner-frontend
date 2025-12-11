import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamProductivityComponent } from './team-productivity.component';

describe('TeamProductivityComponent', () => {
  let component: TeamProductivityComponent;
  let fixture: ComponentFixture<TeamProductivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TeamProductivityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TeamProductivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
