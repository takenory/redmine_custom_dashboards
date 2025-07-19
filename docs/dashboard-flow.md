# Redmine Custom Dashboards - 動作フロー

## 概要

このドキュメントでは、Redmine Custom Dashboardsプラグインのメイン機能である「グローバルメニューからのダッシュボードアクセス」の動作フローを説明します。

## グローバルメニュー「ダッシュボード」クリック時の動作フロー

```mermaid
flowchart TD
    A[ユーザーがグローバルメニュー「ダッシュボード」をクリック] --> B[DashboardsController#show_default]
    
    B --> C{ユーザーのデフォルト<br/>ダッシュボードは存在する？}
    
    C -->|Yes| D[デフォルトダッシュボードを@dashboardに設定]
    C -->|No| E[ダッシュボード一覧画面にリダイレクト]
    
    D --> F[show.html.erbをレンダリング]
    E --> G[index.html.erbを表示]
    
    F --> H[ダッシュボード詳細画面表示]
    G --> I[ダッシュボード一覧画面表示]
    
    H --> J{ダッシュボードに<br/>ウィジェットが設定されている？}
    J -->|Yes| K[ウィジェット表示<br/>（将来実装予定）]
    J -->|No| L[プレースホルダー表示<br/>編集ボタンへの案内]
    
    I --> M[既存ダッシュボード一覧表示<br/>新規作成ボタン表示]
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style I fill:#fff3e0
    style K fill:#f3e5f5
    style L fill:#fce4ec
```

## 実装詳細

### コントローラーアクション

#### `show_default`アクション
- **目的**: グローバルメニューからのエントリーポイント
- **処理内容**:
  1. `User.current.default_dashboard`でデフォルトダッシュボードを取得
  2. 存在する場合は`@dashboard`に設定し、`show`ビューをレンダリング
  3. 存在しない場合は`index`アクションにリダイレクト

#### `show`アクション
- **目的**: 個別ダッシュボードの詳細表示
- **処理内容**: ダッシュボードの内容を表示（ウィジェット機能は将来実装予定）

### ルーティング

```ruby
resources :dashboards do
  collection do
    get :show_default  # /dashboards/show_default
  end
end
```

### メニュー設定

```ruby
menu :top_menu, :dashboards, 
     { controller: 'dashboards', action: 'show_default' }, 
     caption: :label_dashboards, 
     if: Proc.new { User.current.logged? }
```

## ユーザーエクスペリエンス

### シナリオ1: デフォルトダッシュボードが存在する場合
1. ユーザーがメニューをクリック
2. 即座にデフォルトダッシュボードが表示される
3. ダッシュボードの内容（ウィジェット）が表示される
4. 編集やダッシュボード一覧への移動が可能

### シナリオ2: デフォルトダッシュボードが存在しない場合
1. ユーザーがメニューをクリック
2. ダッシュボード一覧画面にリダイレクトされる
3. 既存のダッシュボード一覧が表示される
4. 新規ダッシュボード作成やデフォルト設定が可能

## 権限とセキュリティ

- **ログイン必須**: `before_action :require_login`
- **ダッシュボード権限**: `permission :manage_dashboards`
- **ユーザー固有**: 各ユーザーは自分のダッシュボードのみアクセス可能

## 今後の拡張予定

1. **ウィジェット機能**: ダッシュボードにカスタマイズ可能なウィジェットを追加
2. **ドラッグ&ドロップ**: ウィジェットの配置をドラッグ&ドロップで変更
3. **共有ダッシュボード**: チーム間でダッシュボードを共有する機能
4. **ダッシュボードテンプレート**: 事前定義されたダッシュボードテンプレート

## 関連ファイル

- **コントローラー**: `app/controllers/dashboards_controller.rb`
- **ビュー**: `app/views/dashboards/show.html.erb`, `app/views/dashboards/index.html.erb`
- **ルーティング**: `config/routes.rb`
- **プラグイン設定**: `init.rb`
- **ローカライゼーション**: `config/locales/ja.yml`, `config/locales/en.yml`