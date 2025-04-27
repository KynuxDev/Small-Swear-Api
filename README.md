# Küfür Algılama API (Türkçe)

[![Node.js CI](https://github.com/KynuxDev/Small-Swear-Api/actions/workflows/node.js.yml/badge.svg)](https://github.com/KynuxDev/Small-Swear-Api/actions/workflows/node.js.yml)

Bu proje, sağlanan metin içerisindeki Türkçe küfürleri ve argo kelimeleri algılamak, kategorize etmek ve isteğe bağlı olarak sansürlemek için geliştirilmiş, Node.js tabanlı bir RESTful API sunar.

## ✨ Özellikler

*   **Kapsamlı Küfür Algılama:** Genişletilebilir kelime listeleri kullanarak metinlerdeki küfürleri tespit eder.
*   **Kelime Normalizasyon:** Farklı yazım şekillerini (büyük/küçük harf, Türkçe karakterler, leetspeak) normalize ederek algılama doğruluğunu artırır.
*   **Hassasiyet Seviyeleri:** Algılama hassasiyetini ayarlama imkanı (`exact`, `normal`, `aggressive`).
*   **Kelime İçi Arama:** Kelimelerin içinde geçen küfürleri de bulma seçeneği (`matchInside`).
*   **Sansürleme:** Tespit edilen küfürleri `*` karakteri ile otomatik olarak sansürler.
*   **Kategorizasyon:** Küfürleri yapılandırılabilir kategorilere ayırır (örneğin: "hakaret", "argo", "cinsel içerik").
*   **Beyaz Liste:** Belirli kelimelerin yanlışlıkla küfür olarak algılanmasını engeller.
*   **Yapılandırılabilirlik:** `config.json` dosyası üzerinden kolayca yapılandırılabilir (port, kelime listeleri, güvenlik ayarları vb.).
*   **Güvenlik:** Temel güvenlik önlemleri (Helmet, Rate Limiting) içerir.

## 🚀 Teknolojiler

*   **Node.js:** Çalışma ortamı
*   **Express.js:** Web framework'ü
*   **Helmet:** HTTP başlıklarını ayarlayarak güvenliği artırır
*   **express-rate-limit:** API isteklerini sınırlar

## 🛠️ Kurulum ve Başlatma

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/KynuxDev/Small-Swear-Api.git
    cd Small-Swear-Api
    ```
2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```
3.  **Yapılandırma Dosyasını Oluşturun/Düzenleyin:**
    *   Proje ana dizininde `config.json` adında bir dosya oluşturun.
    *   Aşağıdaki örnek yapıyı kullanarak kendi ayarlarınızı yapın:

    ```json
    {
      "server": {
        "port": 3000,
        "hostname": "localhost" // İsteğe bağlı, boş bırakılırsa 'localhost' kullanılır
      },
      "swearDetection": {
        "useCategorizedList": true, // true ise categorizedWordlistFile kullanılır, false ise simpleWordlistFile
        "simpleWordlistFile": "wordlist.txt", // Basit küfür listesi dosya adı
        "categorizedWordlistFile": "categorized_wordlist.json", // Kategorili küfür listesi dosya adı
        "whitelistFile": "whitelist.txt" // Beyaz liste dosya adı
      },
      "security": {
        "rateLimit": {
          "windowMs": 15 * 60 * 1000, // 15 dakika
          "maxRequests": 100 // 15 dakika içinde IP başına 100 istek
        },
        "maxTextLength": 5000 // Analiz edilecek maksimum metin karakter sayısı
      }
    }
    ```
4.  **Kelime Listelerini Hazırlayın:**
    *   `config.json` içinde belirttiğiniz dosya adlarına göre (`wordlist.txt`, `categorized_wordlist.json`, `whitelist.txt`) kelime listelerinizi proje ana dizinine ekleyin. (Formatlar için "Kelime Listeleri" bölümüne bakın.)
5.  **Uygulamayı Başlatın:**
    *   **Normal Mod:**
        ```bash
        node index.js
        ```
    *   **Geliştirme Modu (nodemon ile otomatik yeniden başlatma için):**
        Eğer `nodemon` kuruluysa ve `package.json` içinde bir `dev` script'i tanımlıysa (örneğin: `"dev": "nodemon index.js"`):
        ```bash
        npm run dev
        ```

API artık `http://<hostname>:<port>` adresinde çalışıyor olacaktır (örneğin: `http://localhost:3000`).

## 🔌 API Kullanımı

### Endpoint: `GET /api/swear/detect`

Metin içinde küfür algılar ve analiz sonuçlarını döndürür.

**Query Parametreleri:**

| Parametre     | Açıklama                                                                                                                                                              | Tür      | Gerekli Mi? | Varsayılan |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :---------- | :--------- |
| `text`        | Analiz edilecek metin.                                                                                                                                                | `string` | **Evet**    | -          |
| `censor`      | `true` veya `1` ise bulunan küfürler sansürlenir (`*` ile).                                                                                                            | `boolean`| Hayır       | `false`    |
| `matchInside` | `true` veya `1` ise ve `sensitivity=normal` ise, kelimelerin *içinde* geçen küfürler de aranır. **Dikkat:** Yanlış pozitiflere neden olabilir.                          | `boolean`| Hayır       | `false`    |
| `sensitivity` | Algılama hassasiyeti: <br> - `exact`: Sadece tam kelime eşleşmesi (normalize edilmiş). `matchInside` yoksayılır. <br> - `normal`: Tam kelime eşleşmesi + `matchInside` kontrolü. <br> - `aggressive`: Tam kelime eşleşmesi + Her zaman kelime içi arama. `matchInside` yoksayılır. | `string` | Hayır       | `normal`   |

**Örnek İstekler:**

*   Basit algılama:
    `/api/swear/detect?text=bu+çok+kötü+bir+durum`
*   Sansürlü ve kelime içi arama (normal hassasiyet):
    `/api/swear/detect?text=lanet+olsun+sana&censor=true&matchInside=true`
*   Sansürlü ve agresif hassasiyet:
    `/api/swear/detect?text=lanetolsun+sana&censor=true&sensitivity=aggressive`
*   Sadece tam eşleşme (sansürsüz):
    `/api/swear/detect?text=lanetolsun+sana&sensitivity=exact`

**Başarılı Yanıt (`200 OK`):**

Yanıt, sorgu detaylarını ve analiz sonuçlarını içerir.

```json
{
    "success": true,
    "query": {
        "text": "lanetolsun sana", // Gönderilen orijinal metin
        "censor": true,           // Sansürleme istendi mi?
        "match_inside_requested": false, // matchInside istendi mi?
        "sensitivity": "aggressive", // Kullanılan hassasiyet seviyesi
        "match_inside_effective": true, // Kelime içi arama etkin miydi?
        "provided_length": 15     // Gönderilen metnin uzunluğu
    },
    "analysis": {
        "contains_swear": true,      // Küfür bulundu mu?
        "detected_swears": [         // Bulunan küfürlerin detayları
            {
                "word": "lanetolsun", // Orijinal kelime
                "category": "kaba",   // Kategorisi (eğer varsa)
                "reason": "içeriyor: lan" // Bulunma nedeni (tam eşleşme veya içerdiği kelime)
            }
        ],
        "detected_swear_count": 1,   // Toplam bulunan küfür sayısı
        "detected_categories": [     // Bulunan tüm kategoriler (tekilleştirilmiş)
            "kaba"
        ],
        "category_counts": {         // Her kategoriden kaç tane bulunduğu
            "kaba": 1
        },
        "word_count": 2,             // Metindeki toplam kelime sayısı
        "swear_density": 0.5000      // Küfür yoğunluğu (küfür sayısı / kelime sayısı)
    },
    "censored_text": "********** sana" // Eğer censor=true ise sansürlenmiş metin
}
```

**Hata Yanıtları:**

*   `400 Bad Request`: Eksik veya geçersiz parametre.
    ```json
    {
        "success": false,
        "error": "Eksik zorunlu query parametresi: text"
    }
    ```
*   `413 Payload Too Large`: `text` parametresi `config.json`'daki `maxTextLength` sınırını aşıyor.
    ```json
    {
        "success": false,
        "error": "Metin uzunluğu 5000 karakteri aşamaz."
    }
    ```
*   `429 Too Many Requests`: Rate limit aşıldı.
    ```json
    {
        "success": false,
        "error": "Çok fazla istek yapıldı, lütfen 15 dakika sonra tekrar deneyin."
    }
    ```
*   `500 Internal Server Error`: Sunucu tarafında beklenmedik bir hata oluştu.
    ```json
    {
        "success": false,
        "error": "Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    }
    ```

## 📚 Kelime Listeleri Yönetimi

API'nin etkinliği büyük ölçüde kullanılan kelime listelerine bağlıdır.

*   **Normalizasyon:** Listelerdeki ve gelen metindeki kelimeler karşılaştırmadan önce `src/utils.js` içerisindeki `normalizeWord` fonksiyonu ile normalize edilir. Bu, büyük/küçük harf, Türkçe karakterler (ş->s, ı->i vb.) ve bazı leetspeak karakterlerinin (örneğin: 3->e, @->a) tutarlı bir şekilde ele alınmasını sağlar. Liste hazırlarken bu normalizasyonun farkında olun.
*   **Basit Liste (`wordlist.txt`):**
    *   Her satıra bir küfür kelimesi yazılır.
    *   Boş satırlar ve yorum satırları (örneğin `#` ile başlayanlar) genellikle göz ardı edilir (kod implementasyonuna bağlı).
    *   Örnek:
        ```
        küfür1
        argoKelime
        hakaret
        ```
*   **Kategorili Liste (`categorized_wordlist.json`):**
    *   JSON formatında bir nesnedir. Anahtarlar küfür kelimeleri, değerler ise kategorileridir.
    *   Örnek:
        ```json
        {
          "küfür1": "hakaret",
          "aptal": "aşağılama",
          "lan": "argo",
          "cinselistek": "cinsel"
        }
        ```
*   **Beyaz Liste (`whitelist.txt`):**
    *   Basit liste formatındadır.
    *   Buradaki kelimeler (normalize edilmiş halleriyle) küfür listesinde olsa bile asla küfür olarak algılanmaz. Özellikle `matchInside` kullanılırken yanlış pozitifleri önlemek için önemlidir.
    *   Örnek:
        ```
        plan
        aslan
        cırtlak
        ```
*   **Liste Seçimi:** `config.json` dosyasındaki `useCategorizedList` ayarı `true` ise kategorili liste, `false` ise basit liste kullanılır. Kategorili liste kullanıldığında, kategorisiz basit küfür algılaması için de bu listenin anahtarları kullanılır.

## 🛡️ Güvenlik

*   **Helmet:** Yaygın web zafiyetlerine karşı koruma sağlamak için HTTP güvenlik başlıklarını ayarlar.
*   **Rate Limiting:** API'nin kötüye kullanılmasını önlemek için belirli bir zaman aralığında yapılabilecek istek sayısını sınırlar (`config.json` -> `security.rateLimit`).
*   **Input Validation:** Gelen metin uzunluğu kontrol edilir (`config.json` -> `security.maxTextLength`).

## 🤝 Katkıda Bulunma

Katkılarınız ve geri bildirimleriniz projeyi geliştirmek için çok değerlidir!

*   **Hata Bildirimi:** Karşılaştığınız hataları lütfen GitHub Issues üzerinden detaylı olarak bildirin.
*   **Özellik İsteği:** Yeni özellikler veya iyileştirmeler için GitHub Issues'u kullanabilirsiniz.
*   **Kod Katkısı:**
    1.  Projeyi fork edin.
    2.  Yeni bir branch oluşturun (`git checkout -b yeni-ozellik`).
    3.  Değişikliklerinizi yapın ve commit'leyin (`git commit -am 'Yeni özellik eklendi'`).
    4.  Fork'unuza push edin (`git push origin yeni-ozellik`).
    5.  Bir Pull Request oluşturun.

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.