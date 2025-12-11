import Contacts

struct ImageMapper: PropertyMapper {
    typealias TDto = String?
    
    // Deskryptor wymagany do pobrania danych binarnych zdjęcia
    var descriptor: CNKeyDescriptor { CNContactImageDataKey as CNKeyDescriptor }
    
    private let service: ImageService
    private let filename: String

    init(service: ImageService, filename: String) {
        self.service = service
        self.filename = filename
    }

    // ODCZYT: Data -> Ścieżka pliku (String)
    func extract(from contact: CNContact) throws -> String? {
        guard let data = contact.imageData else {
            return nil
        }
        return try service.url(from: data, filename: filename)
    }

    // ZAPIS: Ścieżka pliku (String) -> Data
    func apply(_ value: String?, to contact: CNMutableContact) throws {
        guard let path = value else {
            // Jeśli przyszło null/nil -> usuwamy zdjęcie
            contact.imageData = nil
            return
        }
        
        // Jeśli przyszła ścieżka -> ładujemy plik do Data i przypisujemy
        let data = try service.imageData(from: path)
        contact.imageData = data
    }
}
