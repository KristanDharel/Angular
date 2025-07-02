import { TestBed } from '@angular/core/testing';

import { Sellerservice } from './sellerservice';

describe('Sellerservice', () => {
  let service: Sellerservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sellerservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
