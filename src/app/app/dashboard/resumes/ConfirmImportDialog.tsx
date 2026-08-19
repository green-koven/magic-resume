import type { ResumeData } from "@/types/resume";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type ConfirmImportDialogProps = {
    resume: ResumeData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export const ConfirmImportDialog = ({
                                        resume,
                                        open,
                                        onOpenChange,
                                        onConfirm,
                                    }: ConfirmImportDialogProps) => {
    if (!resume) {
        return null;
    }

    const basic = resume.basic;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>确认导入结果</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                        <div className="text-lg font-semibold">
                            {basic.name || "未识别姓名"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {basic.title || "未识别求职方向"}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border p-3">
                            <div className="text-muted-foreground">邮箱</div>
                            <div>{basic.email || "未识别"}</div>
                        </div>

                        <div className="rounded-lg border p-3">
                            <div className="text-muted-foreground">电话</div>
                            <div>{basic.phone || "未识别"}</div>
                        </div>

                        <div className="rounded-lg border p-3">
                            <div className="text-muted-foreground">工作经历</div>
                            <div>{resume.experience?.length || 0}</div>
                        </div>

                        <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">项目数量</div>
                            <div>{resume.projects?.length || 0}</div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button onClick={onConfirm}>
                            确认导入
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};