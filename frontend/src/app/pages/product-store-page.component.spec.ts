import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductStorePageComponent } from './product-store-page.component';

describe('ProductStorePageComponent', () => {
  let component: ProductStorePageComponent;
  let fixture: ComponentFixture<ProductStorePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductStorePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductStorePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
