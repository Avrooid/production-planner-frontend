import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {map, Observable} from "rxjs";
import {ProductDto} from "../../domain/products/product-dto";
import {ProductDetails} from "../../domain/products/product-details";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `/api/v1/products`;

  constructor(private http: HttpClient) {}

  /**
   * Получить все изделия
   */
  getAllProducts(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(this.apiUrl);
  }

  /**
   * Получить изделие по ID
   * @param id ID изделия
   */
  getProductById(id: number): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Создать новое изделие
   * @param productDetails данные изделия
   */
  createProduct(productDetails: ProductDetails): Observable<ProductDto> {
    return this.http.post<ProductDto>(this.apiUrl, productDetails);
  }

  /**
   * Обновить изделие
   * @param id ID изделия
   * @param productDetails обновленные данные
   */
  updateProduct(id: number, productDetails: ProductDetails): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.apiUrl}/${id}`, productDetails);
  }

  /**
   * Удалить изделие
   * @param id ID изделия
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
