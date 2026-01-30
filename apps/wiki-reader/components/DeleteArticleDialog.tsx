import {
  BasicAlertDialog,
  Column,
  Row,
  Spacer,
  Surface,
  Text,
  TextButton,
} from '@expo/ui/jetpack-compose';
import {
  align,
  height,
  paddingAll,
  wrapContentHeight,
  wrapContentWidth,
} from '@expo/ui/jetpack-compose/modifiers';

interface DeleteArticleDialogProps {
  title?: string;
  onDismiss: () => void;
  onDeleteArticle?: () => void;
  onDeleteAll?: () => void;
}

export function DeleteArticleDialog({
  title,
  onDismiss,
  onDeleteArticle,
  onDeleteAll,
}: DeleteArticleDialogProps) {
  const isDeleteAll = title == null;

  return (
    <BasicAlertDialog onDismissRequest={onDismiss}>
      <Surface tonalElevation={6} modifiers={[wrapContentWidth(), wrapContentHeight()]}>
        <Column modifiers={[paddingAll(24)]}>
          <Text style={{ typography: 'headlineSmall' }}>
            {isDeleteAll ? 'Delete all articles?' : 'Delete saved article?'}
          </Text>

          <Spacer modifiers={[paddingAll(16)]} />

          <Text style={{ typography: 'bodyMedium' }}>
            {isDeleteAll
              ? 'Are you sure you want to delete all saved articles? This action cannot be undone.'
              : `Are you sure you want to delete "${title}" from your saved articles?`}
          </Text>

          <Spacer modifiers={[height(24)]} />

          <Row modifiers={[align('end')]}>
            <TextButton onPress={onDismiss}>Cancel</TextButton>
            <TextButton
              onPress={() => {
                onDismiss();
                if (isDeleteAll) {
                  onDeleteAll?.();
                } else {
                  onDeleteArticle?.();
                }
              }}>
              Delete
            </TextButton>
          </Row>
        </Column>
      </Surface>
    </BasicAlertDialog>
  );
}
