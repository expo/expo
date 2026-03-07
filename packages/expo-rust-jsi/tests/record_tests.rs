use expo_rust_jsi::prelude::*;
use std::collections::HashMap;

#[derive(ExpoRecord, Debug, Default, Clone)]
struct SimpleRecord {
    name: String,
    age: f64,
}

#[derive(ExpoRecord, Debug, Default, Clone)]
struct RecordWithOptionals {
    #[field(required)]
    id: String,
    nickname: Option<String>,
    score: Option<f64>,
}

#[derive(ExpoRecord, Debug, Default, Clone)]
struct RecordWithCustomKey {
    #[field(key = "firstName")]
    first_name: String,
    #[field(key = "lastName")]
    last_name: String,
}

#[derive(ExpoRecord, Debug, Default, Clone)]
struct NestedRecord {
    label: String,
    address: Option<AddressRecord>,
}

#[derive(ExpoRecord, Debug, Default, Clone)]
struct AddressRecord {
    street: String,
    city: String,
}

// ---- FromJsValue tests ----

#[test]
fn test_simple_record_from_map() {
    let mut map = HashMap::new();
    map.insert("name".to_owned(), JsValue::String("Alice".into()));
    map.insert("age".to_owned(), JsValue::Number(30.0));
    let val = JsValue::Map(map);

    let record = SimpleRecord::from_js_value(&val).unwrap();
    assert_eq!(record.name, "Alice");
    assert_eq!(record.age, 30.0);
}

#[test]
fn test_simple_record_missing_field_uses_default() {
    let mut map = HashMap::new();
    map.insert("name".to_owned(), JsValue::String("Bob".into()));
    // age is missing — should use Default (0.0)
    let val = JsValue::Map(map);

    let record = SimpleRecord::from_js_value(&val).unwrap();
    assert_eq!(record.name, "Bob");
    assert_eq!(record.age, 0.0);
}

#[test]
fn test_required_field_missing_errors() {
    let map = HashMap::new();
    // id is required but missing
    let val = JsValue::Map(map);

    let result = RecordWithOptionals::from_js_value(&val);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("missing required field 'id'"));
}

#[test]
fn test_optional_fields() {
    let mut map = HashMap::new();
    map.insert("id".to_owned(), JsValue::String("abc".into()));
    // nickname and score are omitted
    let val = JsValue::Map(map);

    let record = RecordWithOptionals::from_js_value(&val).unwrap();
    assert_eq!(record.id, "abc");
    assert_eq!(record.nickname, None);
    assert_eq!(record.score, None);
}

#[test]
fn test_optional_fields_present() {
    let mut map = HashMap::new();
    map.insert("id".to_owned(), JsValue::String("abc".into()));
    map.insert("nickname".to_owned(), JsValue::String("Al".into()));
    map.insert("score".to_owned(), JsValue::Number(99.5));
    let val = JsValue::Map(map);

    let record = RecordWithOptionals::from_js_value(&val).unwrap();
    assert_eq!(record.id, "abc");
    assert_eq!(record.nickname, Some("Al".to_owned()));
    assert_eq!(record.score, Some(99.5));
}

#[test]
fn test_custom_key_names() {
    let mut map = HashMap::new();
    map.insert("firstName".to_owned(), JsValue::String("John".into()));
    map.insert("lastName".to_owned(), JsValue::String("Doe".into()));
    let val = JsValue::Map(map);

    let record = RecordWithCustomKey::from_js_value(&val).unwrap();
    assert_eq!(record.first_name, "John");
    assert_eq!(record.last_name, "Doe");
}

#[test]
fn test_nested_record() {
    let mut addr_map = HashMap::new();
    addr_map.insert("street".to_owned(), JsValue::String("123 Main St".into()));
    addr_map.insert("city".to_owned(), JsValue::String("Springfield".into()));

    let mut map = HashMap::new();
    map.insert("label".to_owned(), JsValue::String("Home".into()));
    map.insert("address".to_owned(), JsValue::Map(addr_map));
    let val = JsValue::Map(map);

    let record = NestedRecord::from_js_value(&val).unwrap();
    assert_eq!(record.label, "Home");
    let addr = record.address.unwrap();
    assert_eq!(addr.street, "123 Main St");
    assert_eq!(addr.city, "Springfield");
}

#[test]
fn test_nested_record_null_optional() {
    let mut map = HashMap::new();
    map.insert("label".to_owned(), JsValue::String("Work".into()));
    // address omitted
    let val = JsValue::Map(map);

    let record = NestedRecord::from_js_value(&val).unwrap();
    assert_eq!(record.label, "Work");
    assert!(record.address.is_none());
}

// ---- IntoJsValue tests ----

#[test]
fn test_simple_record_into_map() {
    let record = SimpleRecord {
        name: "Alice".to_owned(),
        age: 30.0,
    };
    let val = record.into_js_value();
    assert!(val.is_map());
    let map = val.as_map().unwrap();
    assert!(matches!(map.get("name"), Some(JsValue::String(s)) if s == "Alice"));
    assert!(matches!(map.get("age"), Some(JsValue::Number(n)) if *n == 30.0));
}

#[test]
fn test_optional_fields_into_map() {
    let record = RecordWithOptionals {
        id: "x".to_owned(),
        nickname: Some("Al".to_owned()),
        score: None,
    };
    let val = record.into_js_value();
    let map = val.as_map().unwrap();
    assert!(matches!(map.get("id"), Some(JsValue::String(s)) if s == "x"));
    assert!(matches!(map.get("nickname"), Some(JsValue::String(s)) if s == "Al"));
    // score=None should be omitted
    assert!(!map.contains_key("score"));
}

#[test]
fn test_custom_key_into_map() {
    let record = RecordWithCustomKey {
        first_name: "John".to_owned(),
        last_name: "Doe".to_owned(),
    };
    let val = record.into_js_value();
    let map = val.as_map().unwrap();
    assert!(matches!(map.get("firstName"), Some(JsValue::String(s)) if s == "John"));
    assert!(matches!(map.get("lastName"), Some(JsValue::String(s)) if s == "Doe"));
    // Should NOT have the Rust field names
    assert!(!map.contains_key("first_name"));
    assert!(!map.contains_key("last_name"));
}

// ---- Roundtrip tests ----

#[test]
fn test_roundtrip_simple() {
    let original = SimpleRecord {
        name: "Test".to_owned(),
        age: 25.0,
    };
    let js = original.clone().into_js_value();
    let restored = SimpleRecord::from_js_value(&js).unwrap();
    assert_eq!(restored.name, "Test");
    assert_eq!(restored.age, 25.0);
}

#[test]
fn test_roundtrip_with_optionals() {
    let original = RecordWithOptionals {
        id: "123".to_owned(),
        nickname: Some("Nick".to_owned()),
        score: Some(42.0),
    };
    let js = original.clone().into_js_value();
    let restored = RecordWithOptionals::from_js_value(&js).unwrap();
    assert_eq!(restored.id, "123");
    assert_eq!(restored.nickname, Some("Nick".to_owned()));
    assert_eq!(restored.score, Some(42.0));
}

#[test]
fn test_type_error_in_field() {
    let mut map = HashMap::new();
    map.insert("name".to_owned(), JsValue::Number(42.0)); // wrong type
    map.insert("age".to_owned(), JsValue::Number(30.0));
    let val = JsValue::Map(map);

    let result = SimpleRecord::from_js_value(&val);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("field 'name'"));
}

#[test]
fn test_non_object_fails() {
    let result = SimpleRecord::from_js_value(&JsValue::String("not an object".into()));
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("expected object"));
}
