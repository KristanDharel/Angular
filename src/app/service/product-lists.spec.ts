import { TestBed } from '@angular/core/testing';

import { ProductLists } from './product-lists';

describe('ProductLists', () => {
  let service: ProductLists;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductLists);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
