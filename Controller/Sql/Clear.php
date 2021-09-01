<?php
namespace ADM\QuickDevBar\Controller\Sql;

class Clear extends \ADM\QuickDevBar\Controller\Index
{
    public function execute()
    {
        $c = 0;
        foreach (glob('/tmp/*.json') as $json) {
            unlink($json);
            $c++;
        }

        $this->_view->loadLayout();
        $resultRaw = $this->_resultRawFactory->create();

        return $resultRaw->setContents('cleared ' . $c);
    }
}
