export const openPdfBlob = (blob: Blob, popup?: Window | null, filename?: string) => {
  const url = URL.createObjectURL(blob);

  if (popup && !popup.closed) {
    popup.location.href = url;
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    if (filename) {
      link.download = filename;
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
