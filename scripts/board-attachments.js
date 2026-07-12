/**
 * Builds HTML for task attachments in the details view
 * @param {Object} task - The task object
 * @returns {string} HTML string
 */
function buildTaskAttachmentsHtml(task) {
  if (!task.attachments || task.attachments.length === 0) return "";
  
  let thumbnailsHtml = "";
  for (let i = 0; i < task.attachments.length; i++) {
    const att = task.attachments[i];
    const previewSrc = att.preview || att.data;
    thumbnailsHtml += getTaskAttachmentThumbnailTemplate(task.id, i, previewSrc, att.name);
  }

  return getTaskAttachmentsSectionTemplate(thumbnailsHtml);
}

/**
 * Downloads a task attachment.
 * @param {number} taskId - The ID of the task
 * @param {number} index - The index of the attachment
 */
function downloadAttachment(taskId, index) {
  const task = findTask(taskId);
  if (!task || !task.attachments || !task.attachments[index]) return;
  const file = task.attachments[index];
  const link = document.createElement("a");
  link.href = file.data;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
